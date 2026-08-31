import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from app.models.models import User, DeliveryPartner, Delivery, Order, Earning, Commission, Shop, FoodCategory, FoodItem

@pytest.fixture
def delivery_partner_a(client, db):
    """Fixture registering Delivery Partner A."""
    reg = {
        "name": "Rider A",
        "email": "ridera@bbd.ac.in",
        "phone": "+919876543301",
        "password": "password123",
        "role": "DELIVERY_PARTNER",
        "delivery_details": {
            "vehicle_type": "Bicycle",
            "vehicle_number": "UP32-A-111"
        }
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "ridera@bbd.ac.in", "password": "password123"}).json()
    
    user_id = login_res["user"]["id"]
    
    # Assert driver profile exists
    dp = db.query(DeliveryPartner).filter(DeliveryPartner.user_id == user_id).first()
    if not dp:
        dp = DeliveryPartner(user_id=user_id, vehicle_type="Bicycle", vehicle_number="UP32-A-111", is_active=True, is_verified=True)
        db.add(dp)
        db.commit()
    else:
        dp.is_active = True
        db.commit()

    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"},
        "user_id": user_id
    }

@pytest.fixture
def delivery_partner_b(client, db):
    """Fixture registering Delivery Partner B."""
    reg = {
        "name": "Rider B",
        "email": "riderb@bbd.ac.in",
        "phone": "+919876543302",
        "password": "password123",
        "role": "DELIVERY_PARTNER",
        "delivery_details": {
            "vehicle_type": "Bicycle",
            "vehicle_number": "UP32-B-222"
        }
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "riderb@bbd.ac.in", "password": "password123"}).json()
    
    user_id = login_res["user"]["id"]
    
    dp = db.query(DeliveryPartner).filter(DeliveryPartner.user_id == user_id).first()
    if not dp:
        dp = DeliveryPartner(user_id=user_id, vehicle_type="Bicycle", vehicle_number="UP32-B-222", is_active=True, is_verified=True)
        db.add(dp)
        db.commit()
    else:
        dp.is_active = True
        db.commit()

    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"},
        "user_id": user_id
    }


def test_delivery_role_protection(client, test_location):
    """Verify students cannot hit delivery endpoints."""
    reg_student = {
        "name": "Test Student",
        "email": "student_rider@bbd.ac.in",
        "phone": "+919876543303",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": test_location["campus_id"]
        }
    }
    client.post("/api/v1/auth/register", json=reg_student)
    login_res = client.post("/api/v1/auth/login", json={"email": "student_rider@bbd.ac.in", "password": "password123"}).json()
    headers_student = {"Authorization": f"Bearer {login_res['access_token']}"}

    res = client.get("/api/v1/delivery/me", headers=headers_student)
    assert res.status_code == 403


def test_availability_toggles_and_checks(client, db, delivery_partner_a):
    """Test ONLINE / OFFLINE driver availability checks."""
    # 1. Fetch default profile
    res = client.get("/api/v1/delivery/me", headers=delivery_partner_a["headers"])
    assert res.status_code == 200
    assert res.json()["is_active"] is True
    assert res.json()["status"] == "ONLINE"

    # 2. Toggle OFFLINE
    toggle_res = client.patch(
        "/api/v1/delivery/me/availability",
        json={"is_active": False},
        headers=delivery_partner_a["headers"]
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False
    assert toggle_res.json()["status"] == "OFFLINE"

    # 3. Toggle back ONLINE
    toggle_res = client.patch(
        "/api/v1/delivery/me/availability",
        json={"is_active": True},
        headers=delivery_partner_a["headers"]
    )
    assert toggle_res.json()["is_active"] is True
    assert toggle_res.json()["status"] == "ONLINE"


def test_claim_double_assignment_locks(client, db, test_location, delivery_partner_a, delivery_partner_b):
    """Test that two riders cannot accept the same order simultaneously."""
    # 1. Create a shop and an order
    shop = Shop(
        name="Block A Rider Canteen",
        shopkeeper_id="some-sk-id",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-RIDER-CLAIM",
        student_id="student-uuid",
        shop_id=shop.id,
        status="READY_FOR_PICKUP",
        subtotal=Decimal("100.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("117.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    # 2. Rider A claims the order
    claim_a = client.post(
        f"/api/v1/delivery/orders/{order.id}/accept",
        headers=delivery_partner_a["headers"]
    )
    assert claim_a.status_code == 200
    assert claim_a.json()["status"] == "ASSIGNED"

    # 3. Rider B tries to claim the same order
    claim_b = client.post(
        f"/api/v1/delivery/orders/{order.id}/accept",
        headers=delivery_partner_b["headers"]
    )
    assert claim_b.status_code == 409
    assert claim_b.json()["detail"] == "Delivery already assigned to another partner or order is not ready."


def test_delivery_partner_cannot_accept_while_offline(client, db, test_location, delivery_partner_a):
    """Verify that a delivery partner cannot claim orders when set to offline."""
    # Toggle offline first
    client.patch("/api/v1/delivery/me/availability", json={"is_active": False}, headers=delivery_partner_a["headers"])

    shop = Shop(
        name="Offline Test Canteen",
        shopkeeper_id="some-sk-id-2",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-RIDER-OFFLINE",
        student_id="student-uuid",
        shop_id=shop.id,
        status="READY_FOR_PICKUP",
        subtotal=Decimal("50.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("67.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    res = client.post(
        f"/api/v1/delivery/orders/{order.id}/accept",
        headers=delivery_partner_a["headers"]
    )
    assert res.status_code == 400
    assert "Cannot accept deliveries while offline" in res.json()["detail"]


def test_order_delivery_otp_flows(client, db, test_location, delivery_partner_a):
    """Test the complete workflow: Accept -> Pickup -> Start Delivery (generates OTP) -> Verify OTP -> Delivered."""
    # 1. Setup Shop and Order
    shop = Shop(
        name="Flow Test Canteen",
        shopkeeper_id="sk-uuid-3",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-OTP-FLOW",
        student_id="student-uuid",
        shop_id=shop.id,
        status="READY_FOR_PICKUP",
        subtotal=Decimal("200.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("217.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="1111"
    )
    db.add(order)
    db.commit()

    headers = delivery_partner_a["headers"]

    # 2. Accept
    res_accept = client.post(f"/api/v1/delivery/orders/{order.id}/accept", headers=headers)
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "ASSIGNED"

    # 3. Pickup
    res_pickup = client.post(f"/api/v1/delivery/orders/{order.id}/pickup", headers=headers)
    assert res_pickup.status_code == 200
    assert res_pickup.json()["status"] == "PICKED_UP"

    # 4. Start (Generates short-lived OTP)
    res_start = client.post(f"/api/v1/delivery/orders/{order.id}/start", headers=headers)
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "OUT_FOR_DELIVERY"
    
    # Retrieve the newly generated OTP code from the order database record (student side)
    db.refresh(order)
    generated_otp = order.otp
    assert len(generated_otp) == 4

    # 5. Wrong OTP Verification Check
    verify_fail = client.post(
        f"/api/v1/delivery/orders/{order.id}/verify-otp",
        json={"otp": "0000"},  # Mismatch
        headers=headers
    )
    assert verify_fail.status_code == 400
    assert "Invalid verification code" in verify_fail.json()["detail"]

    # 6. Correct OTP Verification Check
    verify_ok = client.post(
        f"/api/v1/delivery/orders/{order.id}/verify-otp",
        json={"otp": generated_otp},
        headers=headers
    )
    assert verify_ok.status_code == 200
    assert verify_ok.json()["status"] == "DELIVERED"
    assert verify_ok.json()["payment_status"] == "PAID"

    # 7. Check Earnings populated
    earnings_res = client.get("/api/v1/delivery/earnings", headers=headers)
    assert earnings_res.status_code == 200
    assert float(earnings_res.json()["today_earnings"]) == 15.00
    assert earnings_res.json()["total_deliveries"] == 1


def test_delivery_otp_brute_force_lock(client, db, test_location, delivery_partner_a):
    """Verify delivery partner is locked out after 5 consecutive incorrect attempts."""
    shop = Shop(
        name="Brute Canteen",
        shopkeeper_id="sk-uuid-4",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-BRUTE",
        student_id="student-uuid",
        shop_id=shop.id,
        status="READY_FOR_PICKUP",
        subtotal=Decimal("100.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("117.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="2222"
    )
    db.add(order)
    db.commit()

    headers = delivery_partner_a["headers"]
    client.post(f"/api/v1/delivery/orders/{order.id}/accept", headers=headers)
    client.post(f"/api/v1/delivery/orders/{order.id}/pickup", headers=headers)
    client.post(f"/api/v1/delivery/orders/{order.id}/start", headers=headers)

    # 5 wrong attempts
    for _ in range(5):
        client.post(
            f"/api/v1/delivery/orders/{order.id}/verify-otp",
            json={"otp": "9999"},
            headers=headers
        )

    # 6th attempt should block immediately with brute force lock message
    res = client.post(
        f"/api/v1/delivery/orders/{order.id}/verify-otp",
        json={"otp": "9999"},
        headers=headers
    )
    assert res.status_code == 400
    assert "Too many incorrect verification attempts" in res.json()["detail"]


def test_delivery_otp_expiration(client, db, test_location, delivery_partner_a):
    """Verify delivery OTP expiration checks."""
    shop = Shop(
        name="Expiry Canteen",
        shopkeeper_id="sk-uuid-5",
        campus_id=test_location["campus_id"],
        is_open=True,
        rating=Decimal("4.0")
    )
    db.add(shop)
    db.flush()

    order = Order(
        order_number="CB-TEST-EXPIRY",
        student_id="student-uuid",
        shop_id=shop.id,
        status="READY_FOR_PICKUP",
        subtotal=Decimal("100.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("117.50"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="3333"
    )
    db.add(order)
    db.commit()

    headers = delivery_partner_a["headers"]
    client.post(f"/api/v1/delivery/orders/{order.id}/accept", headers=headers)
    client.post(f"/api/v1/delivery/orders/{order.id}/pickup", headers=headers)
    client.post(f"/api/v1/delivery/orders/{order.id}/start", headers=headers)
    db.refresh(order)
    generated_otp = order.otp

    # Inject expiration manually in DB
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    delivery.otp_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()

    # Attempt verification should raise expired
    res = client.post(
        f"/api/v1/delivery/orders/{order.id}/verify-otp",
        json={"otp": generated_otp},
        headers=headers
    )
    assert res.status_code == 400
    assert "Verification code has expired" in res.json()["detail"]
