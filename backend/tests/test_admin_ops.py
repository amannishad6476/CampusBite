import pytest
from decimal import Decimal
from app.models.models import User, Student, Shopkeeper, DeliveryPartner, Shop, Order, Earning, Commission, Campus, AuditLog

@pytest.fixture
def admin_user(client, db):
    """Fixture registering and logging in an Admin user."""
    # Ensure role admin registration is handled
    reg = {
        "name": "Super Admin",
        "email": "admin@bbd.ac.in",
        "phone": "+919876543900",
        "password": "adminpassword",
        "role": "ADMIN"
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@bbd.ac.in", "password": "adminpassword"}).json()
    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"},
        "user_id": login_res["user"]["id"]
    }

@pytest.fixture
def non_admin_user(client):
    """Fixture registering and logging in a Student user."""
    reg = {
        "name": "Normal Student",
        "email": "stud@bbd.ac.in",
        "phone": "+919876543901",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": 1  # Standard seeding id
        }
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "stud@bbd.ac.in", "password": "password123"}).json()
    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"}
    }


def test_admin_role_authorization_rejection(client, non_admin_user):
    """Verify that student/non-admin role attempts are blocked with 403."""
    res = client.get("/api/v1/admin/dashboard", headers=non_admin_user["headers"])
    assert res.status_code == 403


def test_admin_dashboard_metrics(client, admin_user):
    """Verify admin dashboard returns structural summary fields."""
    res = client.get("/api/v1/admin/dashboard", headers=admin_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "total_students" in data
    assert "total_shops" in data
    assert "platform_commission" in data
    assert "today_gmv" in data


def test_campus_crud_and_audit_logs(client, db, admin_user):
    """Test campus creation, edit, and deletion with audit log verification."""
    # 1. Create Campus
    payload = {
        "name": "New Lucknow Campus",
        "address": "Faizabad Rd, Lucknow",
        "city_id": 1,
        "latitude": 26.89,
        "longitude": 81.06
    }
    create_res = client.post("/api/v1/admin/campuses", json=payload, headers=admin_user["headers"])
    assert create_res.status_code == 201
    campus_id = create_res.json()["id"]

    # Verify audit log entry is written
    audit = db.query(AuditLog).filter(AuditLog.target_id == str(campus_id), AuditLog.action == "CREATE_CAMPUS").first()
    assert audit is not None
    assert audit.admin_id == admin_user["user_id"]

    # 2. Update Campus
    payload["name"] = "Updated Campus Name"
    update_res = client.put(f"/api/v1/admin/campuses/{campus_id}", json=payload, headers=admin_user["headers"])
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Campus Name"

    # Verify update audit log
    audit_upd = db.query(AuditLog).filter(AuditLog.target_id == str(campus_id), AuditLog.action == "UPDATE_CAMPUS").first()
    assert audit_upd is not None

    # 3. Delete Campus
    del_res = client.delete(f"/api/v1/admin/campuses/{campus_id}", headers=admin_user["headers"])
    assert del_res.status_code == 204

    # Verify delete audit log
    audit_del = db.query(AuditLog).filter(AuditLog.target_id == str(campus_id), AuditLog.action == "DELETE_CAMPUS").first()
    assert audit_del is not None


def test_shop_status_approvals_and_suspensions(client, db, test_location, admin_user):
    """Verify admin can approve or suspend canteens, writing audit details."""
    # 1. Create a shop directly
    shop = Shop(
        name="Canteen Approvals Canteen",
        shopkeeper_id="sk-uuid-99",
        campus_id=test_location["campus_id"],
        is_open=True,
        status="PENDING",
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.commit()

    # 2. Approve Shop
    res = client.patch(
        f"/api/v1/admin/shops/{shop.id}/status",
        json={"status": "ACTIVE", "reason": "Credentials verified."},
        headers=admin_user["headers"]
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ACTIVE"

    # Verify approval audit log
    audit_app = db.query(AuditLog).filter(AuditLog.target_id == shop.id, AuditLog.action == "UPDATE_SHOP_STATUS").first()
    assert audit_app is not None
    assert "Transitioned status" in audit_app.reason
    assert "ACTIVE" in audit_app.reason

    # 3. Suspend Shop
    res_susp = client.patch(
        f"/api/v1/admin/shops/{shop.id}/status",
        json={"status": "SUSPENDED", "reason": "Violation of health codes."},
        headers=admin_user["headers"]
    )
    assert res_susp.status_code == 200
    assert res_susp.json()["status"] == "SUSPENDED"


def test_user_locks_and_suspensions(client, db, admin_user):
    """Verify admin can activate or deactivate student accounts."""
    # 1. Create user to suspend
    reg = {
        "name": "Lock Target",
        "email": "lock@bbd.ac.in",
        "phone": "+919876543912",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": 1
        }
    }
    client.post("/api/v1/auth/register", json=reg)
    target = db.query(User).filter(User.email == "lock@bbd.ac.in").first()
    assert target.is_active is True

    # 2. Suspend User
    res = client.patch(
        f"/api/v1/admin/users/{target.id}/status",
        json={"is_active": False, "reason": "Abusive chat behaviour reports."},
        headers=admin_user["headers"]
    )
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # Check Audit Log
    audit = db.query(AuditLog).filter(AuditLog.target_id == target.id, AuditLog.action == "SUSPEND_USER").first()
    assert audit is not None
    assert "Abusive chat behaviour" in audit.reason


def test_emergency_order_status_overrides(client, db, test_location, admin_user):
    """Test emergency order status changes with mandatory reasons logging."""
    shop = Shop(
        name="Emergency Canteen",
        shopkeeper_id="sk-uuid-101",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-OVERRIDE",
        student_id="student-uuid",
        shop_id=shop.id,
        status="PENDING",
        subtotal=Decimal("100.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("117.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="9999"
    )
    db.add(order)
    db.commit()

    # Attempt override with too short a reason should fail schema validator
    res_fail = client.post(
        f"/api/v1/admin/orders/{order.id}/override",
        json={"status": "CANCELLED", "reason": "No"},
        headers=admin_user["headers"]
    )
    assert res_fail.status_code == 422

    # Valid override
    res_ok = client.post(
        f"/api/v1/admin/orders/{order.id}/override",
        json={"status": "CANCELLED", "reason": "Customer cancelled order via support hotline."},
        headers=admin_user["headers"]
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "CANCELLED"

    # Verify audit log
    audit = db.query(AuditLog).filter(AuditLog.target_id == order.id, AuditLog.action == "OVERRIDE_ORDER").first()
    assert audit is not None
    assert "forced order status" in audit.reason
    assert "Customer cancelled order" in audit.reason
