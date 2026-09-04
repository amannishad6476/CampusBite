import pytest
from decimal import Decimal
from app.models.models import User, Shopkeeper, Shop, FoodCategory, FoodItem, Order, OrderItem, Notification, Review
from app.core.security import get_password_hash

@pytest.fixture
def student_and_shop(db, test_location):
    """Setup a shop, student 1, and student 2 for reviews and notifications tests."""
    campus_id = test_location["campus_id"]

    # 1. Shopkeeper and Shop
    sk_user = User(
        name="Review Test Shopkeeper",
        email="sk_review@bbd.ac.in",
        phone="+919876543201",
        password_hash=get_password_hash("password123"),
        role="SHOPKEEPER"
    )
    db.add(sk_user)
    db.flush()

    shopkeeper = Shopkeeper(user_id=sk_user.id, is_verified=True)
    db.add(shopkeeper)
    db.flush()

    shop = Shop(
        name="Campus Fast Food",
        description="Best Fast Food on campus",
        shopkeeper_id=shopkeeper.user_id,
        campus_id=campus_id,
        rating=Decimal("4.0"),
        is_open=True
    )
    db.add(shop)
    db.flush()

    category = FoodCategory(name="Snacks", shop_id=shop.id)
    db.add(category)
    db.flush()

    item = FoodItem(
        name="Paneer Roll",
        price=Decimal("60.00"),
        is_veg=True,
        is_available=True,
        category_id=category.id,
        shop_id=shop.id
    )
    db.add(item)
    db.flush()

    # 2. Student 1
    s1_user = User(
        name="Aman Student",
        email="aman_student@bbd.ac.in",
        phone="+919876543202",
        password_hash=get_password_hash("password123"),
        role="STUDENT"
    )
    db.add(s1_user)
    db.flush()

    # 3. Student 2
    s2_user = User(
        name="Other Student",
        email="other_student@bbd.ac.in",
        phone="+919876543203",
        password_hash=get_password_hash("password123"),
        role="STUDENT"
    )
    db.add(s2_user)
    db.commit()

    return {
        "shop": shop,
        "item": item,
        "student1": s1_user,
        "student2": s2_user
    }

def get_auth_token(client, email, password="password123"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# REVIEW TESTS
# ==============================================================================

def test_review_delivered_order_success(client, db, student_and_shop):
    """Verify that a student can review their own delivered order and shop rating updates."""
    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    # Create a delivered order
    order = Order(
        order_number="ORD-REV-001",
        student_id=student1.id,
        shop_id=shop.id,
        status="DELIVERED",
        subtotal=Decimal("60.00"),
        delivery_fee=Decimal("15.00"),
        total_amount=Decimal("75.00"),
        payment_status="PAID",
        payment_method="COD",
        delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
        otp="1234"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Submit review
    review_payload = {
        "rating": 5,
        "comment": "Super fast delivery and hot food!"
    }
    response = client.post(f"/api/v1/students/orders/{order.id}/review", json=review_payload, headers=headers)
    assert response.status_code == 201, response.text
    res_data = response.json()
    assert res_data["order_id"] == order.id
    assert res_data["shop_id"] == shop.id
    assert res_data["student_id"] == student1.id
    assert res_data["rating"] == 5
    assert res_data["comment"] == "Super fast delivery and hot food!"

    # Verify shop rating updated in database
    db.refresh(shop)
    assert shop.rating == Decimal("5.0")

    # Verify GET /orders/{id}/review returns the created review
    get_res = client.get(f"/api/v1/students/orders/{order.id}/review", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == res_data["id"]

    # Verify GET /reviews returns the review in the list
    list_res = client.get("/api/v1/students/reviews", headers=headers)
    assert list_res.status_code == 200
    reviews = list_res.json()
    assert len(reviews) >= 1
    assert any(r["id"] == res_data["id"] for r in reviews)


def test_review_undelivered_order_rejected(client, db, student_and_shop):
    """Verify that an order not yet delivered cannot be reviewed (400 Bad Request)."""
    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    for invalid_status in ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"]:
        order = Order(
            order_number=f"ORD-UNDEL-{invalid_status}",
            student_id=student1.id,
            shop_id=shop.id,
            status=invalid_status,
            subtotal=Decimal("60.00"),
            delivery_fee=Decimal("15.00"),
            total_amount=Decimal("75.00"),
            payment_status="PENDING",
            payment_method="COD",
            delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
            otp="1234"
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        res = client.post(
            f"/api/v1/students/orders/{order.id}/review",
            json={"rating": 4, "comment": "Trying early"},
            headers=headers
        )
        assert res.status_code == 400
        assert "delivered" in res.json()["detail"].lower()


def test_review_non_owner_forbidden(client, db, student_and_shop):
    """Verify that Student 2 cannot review Student 1's order (403 Forbidden)."""
    data = student_and_shop
    student1 = data["student1"]
    student2 = data["student2"]
    shop = data["shop"]

    order = Order(
        order_number="ORD-OWNER-TEST",
        student_id=student1.id,
        shop_id=shop.id,
        status="DELIVERED",
        subtotal=Decimal("60.00"),
        delivery_fee=Decimal("15.00"),
        total_amount=Decimal("75.00"),
        payment_status="PAID",
        payment_method="COD",
        delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    token2 = get_auth_token(client, student2.email)
    headers2 = {"Authorization": f"Bearer {token2}"}

    res = client.post(
        f"/api/v1/students/orders/{order.id}/review",
        json={"rating": 5, "comment": "I didn't order this"},
        headers=headers2
    )
    assert res.status_code == 403


def test_review_duplicate_rejected(client, db, student_and_shop):
    """Verify that submitting a second review for the same order is rejected (400 Bad Request)."""
    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    order = Order(
        order_number="ORD-DUP-REV",
        student_id=student1.id,
        shop_id=shop.id,
        status="DELIVERED",
        subtotal=Decimal("60.00"),
        delivery_fee=Decimal("15.00"),
        total_amount=Decimal("75.00"),
        payment_status="PAID",
        payment_method="COD",
        delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    # First review succeeds
    res1 = client.post(
        f"/api/v1/students/orders/{order.id}/review",
        json={"rating": 4, "comment": "First review"},
        headers=headers
    )
    assert res1.status_code == 201

    # Second review fails
    res2 = client.post(
        f"/api/v1/students/orders/{order.id}/review",
        json={"rating": 3, "comment": "Trying to overwrite"},
        headers=headers
    )
    assert res2.status_code == 400
    assert "already" in res2.json()["detail"].lower()


def test_review_validation_bounds(client, db, student_and_shop):
    """Verify rating bounds (1-5) and comment length limit (500 chars)."""
    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    order = Order(
        order_number="ORD-VAL-TEST",
        student_id=student1.id,
        shop_id=shop.id,
        status="DELIVERED",
        subtotal=Decimal("60.00"),
        delivery_fee=Decimal("15.00"),
        total_amount=Decimal("75.00"),
        payment_status="PAID",
        payment_method="COD",
        delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    # Rating 0 (invalid)
    res_0 = client.post(f"/api/v1/students/orders/{order.id}/review", json={"rating": 0}, headers=headers)
    assert res_0.status_code == 422

    # Rating 6 (invalid)
    res_6 = client.post(f"/api/v1/students/orders/{order.id}/review", json={"rating": 6}, headers=headers)
    assert res_6.status_code == 422

    # Comment > 500 chars (invalid)
    res_len = client.post(
        f"/api/v1/students/orders/{order.id}/review",
        json={"rating": 4, "comment": "A" * 501},
        headers=headers
    )
    assert res_len.status_code == 422


# ==============================================================================
# NOTIFICATION TESTS
# ==============================================================================

def test_order_placement_creates_notification(client, db, student_and_shop):
    """Verify that placing an order triggers an in-app notification for the student."""
    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]
    item = data["item"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    order_payload = {
        "shop_id": shop.id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "hostel_name": "Bhabha Hostel",
            "room_number": "204",
            "phone": "+919876543202"
        },
        "items": [
            {
                "food_item_id": item.id,
                "quantity": 2,
                "notes": "Spicy"
            }
        ]
    }
    place_res = client.post("/api/v1/students/orders", json=order_payload, headers=headers)
    assert place_res.status_code == 201, place_res.text
    placed_order = place_res.json()

    # Fetch notifications
    notif_res = client.get("/api/v1/students/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifications = notif_res.json()
    assert len(notifications) >= 1

    # Check notification fields
    order_notif = next((n for n in notifications if n["order_id"] == placed_order["id"]), None)
    assert order_notif is not None
    assert order_notif["type"] == "ORDER_PLACED"
    assert order_notif["is_read"] is False
    assert placed_order["order_number"] in order_notif["message"]


def test_notification_deduplication(db, student_and_shop):
    """Verify that NotificationService deduplicates identical status notifications."""
    from app.services.notification_service import NotificationService

    data = student_and_shop
    student1 = data["student1"]
    shop = data["shop"]

    order = Order(
        order_number="ORD-DEDUP-01",
        student_id=student1.id,
        shop_id=shop.id,
        status="ACCEPTED",
        subtotal=Decimal("60.00"),
        delivery_fee=Decimal("15.00"),
        total_amount=Decimal("75.00"),
        payment_status="PENDING",
        payment_method="COD",
        delivery_address={"campus_name": "Test Campus", "hostel_name": "Tagore Hostel", "room_number": "101", "phone": "+919876543202"},
        otp="1234"
    )
    db.add(order)
    db.commit()

    # Create ACCEPTED notification first time
    n1 = NotificationService.create_order_notification(db, order, "ACCEPTED")
    assert n1 is not None

    # Call it again with same event
    n2 = NotificationService.create_order_notification(db, order, "ACCEPTED")
    assert n2 is not None
    assert n1.id == n2.id  # Same instance returned, no second row inserted

    # Count notifications in db for this order
    count = db.query(Notification).filter(Notification.order_id == order.id).count()
    assert count == 1


def test_notification_read_and_unread_count(client, db, student_and_shop):
    """Verify marking single notification as read and unread counter accuracy."""
    data = student_and_shop
    student1 = data["student1"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    # Create 2 unread notifications for student 1
    n1 = Notification(user_id=student1.id, title="Test 1", message="Msg 1", type="INFO", is_read=False)
    n2 = Notification(user_id=student1.id, title="Test 2", message="Msg 2", type="INFO", is_read=False)
    db.add(n1)
    db.add(n2)
    db.commit()

    # Check unread count
    count_res = client.get("/api/v1/students/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    initial_unread = count_res.json()["unread_count"]
    assert initial_unread >= 2

    # Mark n1 as read
    patch_res = client.patch(f"/api/v1/students/notifications/{n1.id}/read", headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Check unread count decremented by 1
    count_res2 = client.get("/api/v1/students/notifications/unread-count", headers=headers)
    assert count_res2.json()["unread_count"] == initial_unread - 1

    # Mark all read
    read_all_res = client.post("/api/v1/students/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200

    # Unread count should now be 0
    count_res3 = client.get("/api/v1/students/notifications/unread-count", headers=headers)
    assert count_res3.json()["unread_count"] == 0


def test_notification_student_isolation(client, db, student_and_shop):
    """Verify Student 2 cannot see, read, or delete Student 1's notifications."""
    data = student_and_shop
    student1 = data["student1"]
    student2 = data["student2"]

    n1 = Notification(user_id=student1.id, title="Private S1", message="Secret message", type="INFO", is_read=False)
    db.add(n1)
    db.commit()

    token2 = get_auth_token(client, student2.email)
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Student 2 lists notifications - should not include n1
    list_res = client.get("/api/v1/students/notifications", headers=headers2)
    assert list_res.status_code == 200
    s2_notifs = list_res.json()
    assert not any(n["id"] == n1.id for n in s2_notifs)

    # Student 2 tries to mark n1 as read -> 403 Forbidden
    patch_res = client.patch(f"/api/v1/students/notifications/{n1.id}/read", headers=headers2)
    assert patch_res.status_code == 403

    # Student 2 tries to delete n1 -> 403 Forbidden
    del_res = client.delete(f"/api/v1/students/notifications/{n1.id}", headers=headers2)
    assert del_res.status_code == 403


def test_delete_notification_and_clear_all(client, db, student_and_shop):
    """Verify deleting a single notification and clearing all notifications."""
    data = student_and_shop
    student1 = data["student1"]

    token = get_auth_token(client, student1.email)
    headers = {"Authorization": f"Bearer {token}"}

    n = Notification(user_id=student1.id, title="To Delete", message="Deletable", type="INFO", is_read=False)
    db.add(n)
    db.commit()

    del_res = client.delete(f"/api/v1/students/notifications/{n.id}", headers=headers)
    assert del_res.status_code == 200

    # Verify gone
    check_notif = db.query(Notification).filter(Notification.id == n.id).first()
    assert check_notif is None

    # Clear all
    n_extra = Notification(user_id=student1.id, title="Extra", message="Extra", type="INFO", is_read=False)
    db.add(n_extra)
    db.commit()

    clear_res = client.delete("/api/v1/students/notifications", headers=headers)
    assert clear_res.status_code == 200
    assert "cleared" in clear_res.json()["message"].lower()
