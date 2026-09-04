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


def test_admin_shopkeeper_and_canteen_management(client, db, test_location, admin_user):
    """Test admin registering shopkeeper, creating and updating canteen."""
    # 1. Register shopkeeper via admin
    sk_payload = {
        "name": "Vendor Ramesh",
        "email": "ramesh.canteen@bbd.ac.in",
        "phone": "+919876543888",
        "password": "securepassword123"
    }
    sk_res = client.post("/api/v1/admin/shopkeepers", json=sk_payload, headers=admin_user["headers"])
    assert sk_res.status_code == 201
    sk_data = sk_res.json()
    assert sk_data["name"] == "Vendor Ramesh"
    assert "password" not in sk_data
    sk_id = sk_data["id"]

    # 2. Create canteen for this shopkeeper
    shop_payload = {
        "name": "Ramesh Fast Food",
        "description": "Delicious campus snacks",
        "shopkeeper_id": sk_id,
        "campus_id": test_location["campus_id"],
        "phone_number": "+919876543888",
        "opening_time": "09:00 AM",
        "closing_time": "11:00 PM",
        "delivery_available": True
    }
    shop_res = client.post("/api/v1/admin/shops", json=shop_payload, headers=admin_user["headers"])
    assert shop_res.status_code == 201
    shop_id = shop_res.json()["id"]
    assert shop_res.json()["name"] == "Ramesh Fast Food"

    # 3. Update canteen
    upd_res = client.put(f"/api/v1/admin/shops/{shop_id}", json={"name": "Ramesh Gourmet Canteen"}, headers=admin_user["headers"])
    assert upd_res.status_code == 200
    assert upd_res.json()["name"] == "Ramesh Gourmet Canteen"


def test_admin_menu_management(client, db, test_location, admin_user):
    """Test admin creating, updating, and deleting food items."""
    # Create shop directly
    user_sk = User(name="Item Vendor", email="itemvendor@bbd.ac.in", phone="+919876543777", password_hash="hash", role="SHOPKEEPER")
    db.add(user_sk)
    db.flush()
    db.add(Shopkeeper(user_id=user_sk.id))
    shop = Shop(name="Item Shop", shopkeeper_id=user_sk.id, campus_id=test_location["campus_id"], status="APPROVED")
    db.add(shop)
    db.commit()

    # 1. Create food item
    item_payload = {
        "name": "Cheese Burger",
        "description": "Double patty cheesy burger",
        "price": 89.0,
        "is_veg": True,
        "preparation_time": 12,
        "is_available": True
    }
    item_res = client.post(f"/api/v1/admin/shops/{shop.id}/items", json=item_payload, headers=admin_user["headers"])
    assert item_res.status_code == 201
    item_id = item_res.json()["id"]
    assert item_res.json()["name"] == "Cheese Burger"

    # 2. Update food item
    upd_res = client.put(f"/api/v1/admin/items/{item_id}", json={"price": 99.0, "is_available": False}, headers=admin_user["headers"])
    assert upd_res.status_code == 200
    assert float(upd_res.json()["price"]) == 99.0
    assert upd_res.json()["is_available"] is False

    # 3. Delete food item
    del_res = client.delete(f"/api/v1/admin/items/{item_id}", headers=admin_user["headers"])
    assert del_res.status_code == 204


def test_admin_rider_management_and_assignment(client, db, test_location, admin_user):
    """Test admin creating rider, and assigning rider to an order."""
    # 1. Create rider via admin
    rider_payload = {
        "name": "Speedy Rider",
        "email": "speedy.rider@bbd.ac.in",
        "phone": "+919876543666",
        "password": "riderpassword123",
        "vehicle_type": "EV_BIKE",
        "vehicle_number": "UP-32-AB-1234"
    }
    rider_res = client.post("/api/v1/admin/delivery-partners", json=rider_payload, headers=admin_user["headers"])
    assert rider_res.status_code == 201
    rider_id = rider_res.json()["id"]

    # Create order to assign
    user_sk = User(name="Ord Vendor", email="ordvendor@bbd.ac.in", phone="+919876543555", password_hash="hash", role="SHOPKEEPER")
    db.add(user_sk)
    db.flush()
    db.add(Shopkeeper(user_id=user_sk.id))
    shop = Shop(name="Ord Shop", shopkeeper_id=user_sk.id, campus_id=test_location["campus_id"], status="APPROVED")
    db.add(shop)
    db.flush()
    order = Order(
        order_number="CB-TEST-ASSIGN",
        student_id="student-uuid-2",
        shop_id=shop.id,
        status="READY",
        subtotal=Decimal("150.00"),
        delivery_fee=Decimal("20.00"),
        tax=Decimal("5.00"),
        total_amount=Decimal("175.00"),
        payment_status="PAID",
        payment_method="ONLINE",
        delivery_address={"campus_name": "BBD Campus"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    # 2. Assign rider to order
    assign_res = client.post(
        f"/api/v1/admin/orders/{order.id}/assign-rider",
        json={"delivery_partner_id": rider_id},
        headers=admin_user["headers"]
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["delivery_partner_id"] == rider_id
    assert assign_res.json()["status"] == "ASSIGNED"


def test_admin_payments_and_reports(client, db, test_location, admin_user):
    """Test admin fetching payments ledger and reports."""
    # 1. Fetch payments
    pay_res = client.get("/api/v1/admin/payments", headers=admin_user["headers"])
    assert pay_res.status_code == 200
    assert isinstance(pay_res.json(), list)

    # 2. Fetch reports
    rep_res = client.get("/api/v1/admin/reports", headers=admin_user["headers"])
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert "today" in rep_data
    assert "this_week" in rep_data
    assert "canteens" in rep_data
    assert "riders" in rep_data


def test_admin_shopkeeper_full_onboarding_lifecycle(client, db, test_location, admin_user, non_admin_user):
    """
    Verify complete Shopkeeper onboarding flow:
    Admin login -> POST /admin/shopkeepers -> verify user/profile creation ->
    verify password hashing -> verify SHOPKEEPER role -> verify duplicate rejection ->
    verify shopkeeper login -> verify non-admin blocked (403) -> verify canteen assignment.
    """
    # 1. Admin creates shopkeeper
    payload = {
        "name": "Sunil Kumar",
        "email": "sunil.vendor@bbd.ac.in",
        "phone": "+919876543111",
        "password": "SunilPassword@123"
    }
    create_res = client.post("/api/v1/admin/shopkeepers", json=payload, headers=admin_user["headers"])
    assert create_res.status_code == 201
    created_data = create_res.json()
    sk_id = created_data["id"]

    # 2. Verify User & Shopkeeper profile in DB
    user_row = db.query(User).filter(User.id == sk_id).first()
    assert user_row is not None
    assert user_row.email == "sunil.vendor@bbd.ac.in"
    assert user_row.role == "SHOPKEEPER"
    assert user_row.is_active is True

    # 3. Verify password is securely hashed (not stored plaintext)
    assert user_row.password_hash != "SunilPassword@123"
    assert len(user_row.password_hash) >= 50

    sk_profile = db.query(Shopkeeper).filter(Shopkeeper.user_id == sk_id).first()
    assert sk_profile is not None

    # 4. Verify duplicate email/phone is rejected
    dup_res = client.post("/api/v1/admin/shopkeepers", json=payload, headers=admin_user["headers"])
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 5. Verify newly created shopkeeper can log in
    sk_login = client.post("/api/v1/auth/login", json={
        "email": "sunil.vendor@bbd.ac.in",
        "password": "SunilPassword@123"
    })
    assert sk_login.status_code == 200
    sk_token = sk_login.json()["access_token"]
    assert sk_token is not None
    assert sk_login.json()["user"]["role"] == "SHOPKEEPER"

    # 6. Verify non-admin (including the shopkeeper itself) cannot call admin endpoint
    sk_headers = {"Authorization": f"Bearer {sk_token}"}
    blocked_res = client.post("/api/v1/admin/shopkeepers", json={
        "name": "Hacker",
        "email": "hacker@bbd.ac.in",
        "phone": "+919876543000",
        "password": "hack"
    }, headers=sk_headers)
    assert blocked_res.status_code == 403

    # Student cannot call admin endpoint
    student_blocked = client.post("/api/v1/admin/shopkeepers", json={
        "name": "Student Attempt",
        "email": "student_attempt@bbd.ac.in",
        "phone": "+919876543001",
        "password": "pass"
    }, headers=non_admin_user["headers"])
    assert student_blocked.status_code == 403

    # 7. Verify newly created shopkeeper can be assigned to a canteen
    shop_payload = {
        "name": "Sunil Chai & Maggie",
        "description": "Hot snacks and beverages",
        "shopkeeper_id": sk_id,
        "campus_id": test_location["campus_id"],
        "phone_number": "+919876543111"
    }
    canteen_res = client.post("/api/v1/admin/shops", json=shop_payload, headers=admin_user["headers"])
    assert canteen_res.status_code == 201
    assert canteen_res.json()["shopkeeper_id"] == sk_id
    assert canteen_res.json()["name"] == "Sunil Chai & Maggie"


def test_admin_full_role_isolation(client, db, test_location, admin_user):
    """
    Verify strict role isolation across all roles:
    STUDENT -> 403
    SHOPKEEPER -> 403
    DELIVERY_PARTNER -> 403
    ADMIN -> 200
    """
    # 1. Register Student
    client.post("/api/v1/auth/register", json={
        "name": "Iso Student",
        "email": "iso.student@bbd.ac.in",
        "phone": "+919876543201",
        "password": "Password123",
        "role": "STUDENT",
        "student_details": {"campus_id": test_location["campus_id"]}
    })
    stud_login = client.post("/api/v1/auth/login", json={"email": "iso.student@bbd.ac.in", "password": "Password123"}).json()
    stud_headers = {"Authorization": f"Bearer {stud_login['access_token']}"}

    # 2. Register Shopkeeper
    client.post("/api/v1/admin/shopkeepers", json={
        "name": "Iso Vendor",
        "email": "iso.vendor@bbd.ac.in",
        "phone": "+919876543202",
        "password": "Password123"
    }, headers=admin_user["headers"])
    sk_login = client.post("/api/v1/auth/login", json={"email": "iso.vendor@bbd.ac.in", "password": "Password123"}).json()
    sk_headers = {"Authorization": f"Bearer {sk_login['access_token']}"}

    # 3. Register Delivery Partner
    client.post("/api/v1/admin/delivery-partners", json={
        "name": "Iso Rider",
        "email": "iso.rider@bbd.ac.in",
        "phone": "+919876543203",
        "password": "Password123",
        "vehicle_type": "BIKE"
    }, headers=admin_user["headers"])
    rider_login = client.post("/api/v1/auth/login", json={"email": "iso.rider@bbd.ac.in", "password": "Password123"}).json()
    rider_headers = {"Authorization": f"Bearer {rider_login['access_token']}"}

    endpoints = [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/payments",
        "/api/v1/admin/reports",
        "/api/v1/admin/students"
    ]

    for ep in endpoints:
        assert client.get(ep, headers=stud_headers).status_code == 403, f"Student accessed {ep}"
        assert client.get(ep, headers=sk_headers).status_code == 403, f"Shopkeeper accessed {ep}"
        assert client.get(ep, headers=rider_headers).status_code == 403, f"Delivery partner accessed {ep}"
        assert client.get(ep, headers=admin_user["headers"]).status_code == 200, f"Admin rejected on {ep}"


def test_admin_student_order_history(client, db, test_location, admin_user):
    """Test GET /admin/students/{student_id}/orders returns student orders."""
    # Register student
    s_res = client.post("/api/v1/auth/register", json={
        "name": "History Student",
        "email": "hist.student@bbd.ac.in",
        "phone": "+919876543301",
        "password": "Password123",
        "role": "STUDENT",
        "student_details": {"campus_id": test_location["campus_id"]}
    }).json()
    student_id = s_res["id"]

    # Check initially empty
    res = client.get(f"/api/v1/admin/students/{student_id}/orders", headers=admin_user["headers"])
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) == 0


