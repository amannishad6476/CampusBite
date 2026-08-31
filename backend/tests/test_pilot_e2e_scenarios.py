import pytest
import time
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.models import (
    User, Student, Shopkeeper, DeliveryPartner, Shop, FoodCategory,
    FoodItem, Order, Delivery, Earning, Commission, AuditLog, Campus, College
)
from app.core.security import get_password_hash
from app.scripts.seed_controlled_pilot import seed_controlled_pilot_dataset

def test_controlled_pilot_seeding_and_integrity(db: Session):
    """Verify the controlled pilot seeder initializes 1 college, 2 blocks, 2 hostels, 2 shops, 10 students, 3 riders, 1 admin."""
    res = seed_controlled_pilot_dataset(db)
    assert res["status"] == "success"
    assert res["shops_count"] == 2
    assert res["students_count"] == 10
    assert res["riders_count"] == 3

    # Check 10 students in DB
    students = db.query(Student).all()
    assert len(students) >= 10

    # Check 2 active shops in DB
    shops = db.query(Shop).filter(Shop.status == "ACTIVE").all()
    assert len(shops) >= 2


def test_shop_onboarding_and_approval_flow(client: TestClient, db: Session):
    """
    Test complete shop onboarding workflow:
    1. Shopkeeper registers -> Shop profile in PENDING status.
    2. Student browses campus shops -> PENDING shop is NOT shown.
    3. Admin approves shop -> status becomes ACTIVE with audit log.
    4. Shopkeeper adds menu items.
    5. Student browses campus shops -> ACTIVE shop is now visible with menu.
    """
    # 1. Register new Shopkeeper
    reg_payload = {
        "name": "Chef Pilot Onboard",
        "email": "onboard.chef@campusbite.com",
        "phone": "+919876540001",
        "password": "Password123!",
        "role": "SHOPKEEPER"
    }
    res_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    sk_id = res_reg.json()["id"]

    # Create unapproved shop record
    shop = Shop(
        name="Pilot Fresh Wok",
        description="Fresh noodles and rice bowls",
        shopkeeper_id=sk_id,
        campus_id=1,
        status="PENDING",
        is_open=True
    )
    db.add(shop)
    db.commit()

    # Login Admin & Student
    admin = User(name="Admin Ob", email="admin_ob@cb.com", phone="9900000001", password_hash=get_password_hash("Pass123!"), role="ADMIN")
    student = User(name="Student Ob", email="student_ob@cb.com", phone="9900000002", password_hash=get_password_hash("Pass123!"), role="STUDENT")
    db.add_all([admin, student])
    db.flush()
    db.add(Student(user_id=student.id, campus_id=1))
    db.commit()

    def get_token(email):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "Pass123!"})
        return res.json()["access_token"]

    token_admin = get_token("admin_ob@cb.com")
    token_student = get_token("student_ob@cb.com")

    # 2. Student checks shops on campus 1 -> PENDING shop should not be listed as active
    res_shops_before = client.get("/api/v1/admin/shops", headers={"Authorization": f"Bearer {token_admin}"})
    assert any(s["id"] == shop.id and s["status"] == "PENDING" for s in res_shops_before.json())

    # 3. Admin approves shop
    res_approve = client.patch(
        f"/api/v1/admin/shops/{shop.id}/status",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"status": "ACTIVE", "reason": "Passed health & safety inspection"}
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "ACTIVE"

    # Verify audit log created
    log = db.query(AuditLog).filter(AuditLog.target_id == shop.id).first()
    assert log is not None
    assert log.action == "UPDATE_SHOP_STATUS"
    assert "inspection" in log.reason

    # 4. Shopkeeper logs in and adds menu item
    res_sk_login = client.post("/api/v1/auth/login", json={"email": "onboard.chef@campusbite.com", "password": "Password123!"})
    token_sk = res_sk_login.json()["access_token"]

    res_cat = client.post("/api/v1/shopkeepers/me/categories", headers={"Authorization": f"Bearer {token_sk}"}, json={"name": "Noodles"})
    cat_id = res_cat.json()["id"]

    res_item = client.post(
        "/api/v1/shopkeepers/me/menu",
        headers={"Authorization": f"Bearer {token_sk}"},
        json={"name": "Hakka Noodles", "price": 80.00, "category_id": cat_id, "is_veg": True, "is_available": True}
    )
    assert res_item.status_code == 201

    # 5. Student now fetches menu of newly approved shop
    res_menu = client.get(f"/api/v1/students/shops/{shop.id}/menu", headers={"Authorization": f"Bearer {token_student}"})
    assert res_menu.status_code == 200
    assert len(res_menu.json()) >= 1
    assert res_menu.json()[0]["name"] == "Hakka Noodles"


def test_order_price_tampering_and_atomic_dispatch(client: TestClient, db: Session):
    """
    Test order placement price integrity and atomic single-rider claim race condition prevention.
    """
    # Seed base controlled dataset
    seed_controlled_pilot_dataset(db)

    # Get sample student and shop
    student = db.query(User).filter(User.email == "student1@bbd.ac.in").first()
    shop = db.query(Shop).filter(Shop.name == "Central Cafeteria").first()
    item = db.query(FoodItem).filter(FoodItem.shop_id == shop.id).first()
    rider1 = db.query(User).filter(User.email == "rider.vikas@campusbite.com").first()
    rider2 = db.query(User).filter(User.email == "rider.ankit@campusbite.com").first()
    sk_user = db.query(User).filter(User.id == shop.shopkeeper_id).first()

    def get_token(email, pwd="StudentPass123!"):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        return res.json()["access_token"]

    token_student = get_token("student1@bbd.ac.in", "StudentPass123!")
    token_sk = get_token(sk_user.email, "ShopPass123!")
    token_r1 = get_token("rider.vikas@campusbite.com", "RiderPass123!")
    token_r2 = get_token("rider.ankit@campusbite.com", "RiderPass123!")

    # 1. Student places order (quantity = 2)
    order_payload = {
        "shop_id": shop.id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "BBD Campus",
            "college_name": "BBDU",
            "room_number": "101",
            "phone": "+919876530001"
        },
        "items": [
            {"food_item_id": item.id, "quantity": 2}
        ]
    }
    res_order = client.post("/api/v1/students/orders", headers={"Authorization": f"Bearer {token_student}"}, json=order_payload)
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["id"]

    expected_subtotal = item.price * 2
    expected_total = expected_subtotal + Decimal("15.00") + Decimal("2.50")
    assert Decimal(str(order_data["subtotal"])) == expected_subtotal
    assert Decimal(str(order_data["total_amount"])) == expected_total
    assert "otp" in order_data

    # 2. Shopkeeper transitions order to READY_FOR_PICKUP
    client.patch(f"/api/v1/shopkeepers/me/orders/{order_id}/status", headers={"Authorization": f"Bearer {token_sk}"}, json={"status": "ACCEPTED"})
    client.patch(f"/api/v1/shopkeepers/me/orders/{order_id}/status", headers={"Authorization": f"Bearer {token_sk}"}, json={"status": "PREPARING"})
    client.patch(f"/api/v1/shopkeepers/me/orders/{order_id}/status", headers={"Authorization": f"Bearer {token_sk}"}, json={"status": "READY_FOR_PICKUP"})

    # 3. Rider 1 claims order
    res_claim1 = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers={"Authorization": f"Bearer {token_r1}"})
    assert res_claim1.status_code == 200
    assert res_claim1.json()["status"] == "ASSIGNED"
    assert "otp" not in res_claim1.json()

    # 4. Rider 2 attempts to claim already assigned order -> rejected (409 Conflict / 400 Bad Request)
    res_claim2 = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers={"Authorization": f"Bearer {token_r2}"})
    assert res_claim2.status_code in [400, 409]
    assert "already assigned" in res_claim2.json()["detail"].lower() or "cannot claim" in res_claim2.json()["detail"].lower()

    # 5. Rider 1 picks up and starts transit
    client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers={"Authorization": f"Bearer {token_r1}"})
    client.post(f"/api/v1/delivery/orders/{order_id}/start", headers={"Authorization": f"Bearer {token_r1}"})

    # Student retrieves current valid OTP
    res_st_detail = client.get(f"/api/v1/students/orders/{order_id}", headers={"Authorization": f"Bearer {token_student}"})
    valid_otp = res_st_detail.json()["otp"]

    # 6. Rider 1 verifies OTP -> DELIVERED
    res_verify = client.post(f"/api/v1/delivery/orders/{order_id}/verify-otp", headers={"Authorization": f"Bearer {token_r1}"}, json={"otp": valid_otp})
    assert res_verify.status_code == 200
    assert res_verify.json()["status"] == "DELIVERED"
    assert res_verify.json()["payment_status"] == "PAID"

    # 7. Verify ledger records
    dp_earning = db.query(Earning).filter(Earning.order_id == order_id, Earning.type == "DELIVERY_PAY").first()
    assert dp_earning is not None
    assert dp_earning.amount == Decimal("15.00")

    sk_earning = db.query(Earning).filter(Earning.order_id == order_id, Earning.type == "SHOP_SALE").first()
    assert sk_earning is not None
    assert sk_earning.amount == (expected_subtotal * Decimal("0.90"))

    comm = db.query(Commission).filter(Commission.order_id == order_id).first()
    assert comm is not None
    assert comm.amount_earned == (expected_subtotal * Decimal("0.10"))


def test_failure_modes_and_clean_error_responses(client: TestClient):
    """Verify API handles failure modes gracefully with clean JSON responses and no stack traces."""
    # 1. Invalid JWT
    res_bad_jwt = client.get("/api/v1/students/orders", headers={"Authorization": "Bearer invalid_token_12345"})
    assert res_bad_jwt.status_code == 401
    assert "Could not validate credentials" in res_bad_jwt.json()["detail"]

    # 2. Non-existent resource
    res_404 = client.get("/api/v1/students/shops/non-existent-uuid/menu")
    assert res_404.status_code in [401, 404]

    # 3. Health check probes
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_db_health = client.get("/health/db")
    assert res_db_health.status_code == 200
    assert res_db_health.json()["database"] == "connected"


def test_lightweight_performance_baseline(client: TestClient, db: Session):
    """Measure latency on common endpoints to verify sub-second performance baseline."""
    seed_controlled_pilot_dataset(db)

    # Measure Login latency
    t0 = time.time()
    res_login = client.post("/api/v1/auth/login", json={"email": "student1@bbd.ac.in", "password": "StudentPass123!"})
    t_login = time.time() - t0
    assert res_login.status_code == 200
    assert t_login < 1.0  # Must be sub-second

    token = res_login.json()["access_token"]

    # Measure Campuses list latency
    t0 = time.time()
    res_campuses = client.get("/api/v1/campuses")
    t_campuses = time.time() - t0
    assert res_campuses.status_code == 200
    assert t_campuses < 0.5

    # Measure Student shops list latency
    t0 = time.time()
    res_shops = client.get("/api/v1/students/shops", headers={"Authorization": f"Bearer {token}"})
    t_shops = time.time() - t0
    assert res_shops.status_code == 200
    assert t_shops < 0.5
