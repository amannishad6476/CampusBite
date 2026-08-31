import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.models import (
    User, Campus, College, Block, Hostel, Shop, FoodCategory, FoodItem,
    Order, Delivery, Earning, Commission, Student, Shopkeeper, DeliveryPartner
)
from app.core.security import get_password_hash

def test_complete_e2e_lifecycle(client: TestClient, db: Session):
    """
    End-to-End Scenario:
    1. Student registration & campus setup
    2. Shopkeeper creates menu item
    3. Student orders food (server computes subtotal & fee)
    4. Shopkeeper accepts -> prepares -> marks ready
    5. Delivery partner views available orders (OTP hidden!) -> accepts -> picks up -> starts transit
    6. Delivery partner attempts wrong OTP (rejected) -> verifies correct OTP -> DELIVERED
    7. Earnings ledger & Platform commission finalized strictly server-side
    8. Admin dashboard & finance reports reflect accurate metrics
    """

    # 1. Setup Hierarchy
    campus = Campus(name="E2E Global Campus", address="Knowledge Park", city_id=1)
    db.add(campus)
    db.commit()
    db.refresh(campus)

    college = College(name="E2E Institute of Tech", campus_id=campus.id)
    db.add(college)
    db.commit()
    db.refresh(college)

    block = Block(name="Block C", campus_id=campus.id, college_id=college.id)
    db.add(block)
    db.commit()

    # 2. Setup Users
    # Admin
    admin_user = User(
        name="Super Admin",
        email="superadmin_e2e@campusbite.com",
        phone="9999900001",
        password_hash=get_password_hash("AdminPass123!"),
        role="ADMIN"
    )
    db.add(admin_user)

    # Student
    student_user = User(
        name="Alice Student",
        email="alice_e2e@student.ac.in",
        phone="9999900002",
        password_hash=get_password_hash("StudentPass123!"),
        role="STUDENT"
    )
    db.add(student_user)
    db.flush()
    student_prof = Student(user_id=student_user.id, campus_id=campus.id, college_id=college.id)
    db.add(student_prof)

    # Shopkeeper
    sk_user = User(
        name="Chef Bob",
        email="bob_e2e@canteen.com",
        phone="9999900003",
        password_hash=get_password_hash("ChefPass123!"),
        role="SHOPKEEPER"
    )
    db.add(sk_user)
    db.flush()
    sk_prof = Shopkeeper(user_id=sk_user.id)
    db.add(sk_prof)

    shop = Shop(
        name="Bob's Fast Bites",
        description="Fresh burgers & rolls",
        shopkeeper_id=sk_user.id,
        campus_id=campus.id,
        status="ACTIVE"
    )
    db.add(shop)
    db.flush()

    # Delivery Partner
    dp_user = User(
        name="Dave Rider",
        email="dave_e2e@rider.com",
        phone="9999900004",
        password_hash=get_password_hash("RiderPass123!"),
        role="DELIVERY_PARTNER"
    )
    db.add(dp_user)
    db.flush()
    dp_prof = DeliveryPartner(
        user_id=dp_user.id,
        vehicle_type="Electric Scooter",
        vehicle_number="UP32-E2E-100",
        is_active=True
    )
    db.add(dp_prof)
    db.commit()

    # 3. Log in all actors
    def get_token(email, password):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200
        return res.json()["access_token"]

    admin_token = get_token("superadmin_e2e@campusbite.com", "AdminPass123!")
    student_token = get_token("alice_e2e@student.ac.in", "StudentPass123!")
    sk_token = get_token("bob_e2e@canteen.com", "ChefPass123!")
    dp_token = get_token("dave_e2e@rider.com", "RiderPass123!")

    # 4. Shopkeeper adds category and menu item
    res_cat = client.post(
        "/api/v1/shopkeepers/me/categories",
        headers={"Authorization": f"Bearer {sk_token}"},
        json={"name": "Burgers"}
    )
    assert res_cat.status_code == 201
    cat_id = res_cat.json()["id"]

    res_item = client.post(
        "/api/v1/shopkeepers/me/menu",
        headers={"Authorization": f"Bearer {sk_token}"},
        json={
            "name": "Paneer Supreme Burger",
            "price": 100.00,
            "category_id": cat_id,
            "is_veg": True,
            "is_available": True,
            "preparation_time": 10
        }
    )
    assert res_item.status_code == 201
    item_id = res_item.json()["id"]

    # 5. Student places an order (2 burgers = 200.00 subtotal)
    order_payload = {
        "shop_id": shop.id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": campus.name,
            "college_name": college.name,
            "block_name": "Block C",
            "room_number": "304",
            "phone": "9999900002"
        },
        "items": [
            {
                "food_item_id": item_id,
                "quantity": 2,
                "notes": "Extra mayo"
            }
        ]
    }
    res_order = client.post(
        "/api/v1/students/orders",
        headers={"Authorization": f"Bearer {student_token}"},
        json=order_payload
    )
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["id"]

    # Verify server-side pricing
    assert Decimal(str(order_data["subtotal"])) == Decimal("200.00")
    assert Decimal(str(order_data["delivery_fee"])) == Decimal("15.00")
    assert Decimal(str(order_data["tax"])) == Decimal("2.50")
    assert Decimal(str(order_data["total_amount"])) == Decimal("217.50")
    assert order_data["status"] == "PENDING"
    assert "otp" in order_data  # Student has OTP!

    # 6. Shopkeeper transitions order: ACCEPTED -> PREPARING -> READY_FOR_PICKUP
    res_accept = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {sk_token}"},
        json={"status": "ACCEPTED"}
    )
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "ACCEPTED"
    assert "otp" not in res_accept.json()  # Shopkeeper cannot view student's OTP!

    res_prep = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {sk_token}"},
        json={"status": "PREPARING"}
    )
    assert res_prep.status_code == 200
    assert res_prep.json()["status"] == "PREPARING"

    res_ready = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {sk_token}"},
        json={"status": "READY_FOR_PICKUP"}
    )
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "READY_FOR_PICKUP"

    # 7. Delivery Partner checks available orders
    res_avail = client.get(
        "/api/v1/delivery/available-orders",
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert res_avail.status_code == 200
    avail_list = res_avail.json()
    assert any(o["id"] == order_id for o in avail_list)
    # Check that OTP is stripped for rider
    matched_avail = next(o for o in avail_list if o["id"] == order_id)
    assert "otp" not in matched_avail

    # 8. Delivery Partner claims order
    res_claim = client.post(
        f"/api/v1/delivery/orders/{order_id}/accept",
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert res_claim.status_code == 200
    assert res_claim.json()["status"] == "ASSIGNED"
    assert "otp" not in res_claim.json()

    # 9. Delivery Partner picks up
    res_pickup = client.post(
        f"/api/v1/delivery/orders/{order_id}/pickup",
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert res_pickup.status_code == 200
    assert res_pickup.json()["status"] == "PICKED_UP"

    # 10. Delivery Partner starts transit (generates delivery OTP hash)
    res_start = client.post(
        f"/api/v1/delivery/orders/{order_id}/start",
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "OUT_FOR_DELIVERY"

    # Student checks their active order details to get current verification OTP
    res_student_order = client.get(
        f"/api/v1/students/orders/{order_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_student_order.status_code == 200
    student_live_otp = res_student_order.json()["otp"]
    assert len(student_live_otp) == 4

    # 11. Delivery Partner tries wrong OTP first
    res_wrong_otp = client.post(
        f"/api/v1/delivery/orders/{order_id}/verify-otp",
        headers={"Authorization": f"Bearer {dp_token}"},
        json={"otp": "0000" if student_live_otp != "0000" else "1111"}
    )
    assert res_wrong_otp.status_code == 400
    assert "Invalid verification code" in res_wrong_otp.json()["detail"]

    # 12. Delivery Partner submits valid student OTP
    res_valid_otp = client.post(
        f"/api/v1/delivery/orders/{order_id}/verify-otp",
        headers={"Authorization": f"Bearer {dp_token}"},
        json={"otp": student_live_otp}
    )
    assert res_valid_otp.status_code == 200
    assert res_valid_otp.json()["status"] == "DELIVERED"

    # 13. Verify Database records after completion
    final_order = db.query(Order).filter(Order.id == order_id).first()
    assert final_order.status == "DELIVERED"
    assert final_order.payment_status == "PAID"

    # Verify Shopkeeper Earning: Subtotal (200.00) - 10% Commission (20.00) = 180.00
    sk_earnings = db.query(Earning).filter(
        Earning.user_id == sk_user.id,
        Earning.order_id == order_id,
        Earning.type == "SHOP_SALE"
    ).all()
    assert len(sk_earnings) == 1
    assert sk_earnings[0].amount == Decimal("180.00")

    # Verify Delivery Partner Earning: 15.00
    dp_earnings = db.query(Earning).filter(
        Earning.user_id == dp_user.id,
        Earning.order_id == order_id,
        Earning.type == "DELIVERY_PAY"
    ).all()
    assert len(dp_earnings) == 1
    assert dp_earnings[0].amount == Decimal("15.00")

    # Verify Platform Commission: 20.00
    commissions = db.query(Commission).filter(Commission.order_id == order_id).all()
    assert len(commissions) == 1
    assert commissions[0].amount_earned == Decimal("20.00")

    # 14. Verify Admin Dashboard & Finance Reports
    res_dash = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["completed_orders"] >= 1
    assert Decimal(str(dash_data["platform_commission"])) >= Decimal("20.00")

    res_fin = client.get(
        "/api/v1/admin/finance",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_fin.status_code == 200
    fin_data = res_fin.json()
    assert Decimal(str(fin_data["shopkeepers"]["net_earnings"])) >= Decimal("180.00")
    assert Decimal(str(fin_data["delivery_partners"]["net_earnings"])) >= Decimal("15.00")
    assert Decimal(str(fin_data["platform"]["commission_revenue"])) >= Decimal("20.00")
