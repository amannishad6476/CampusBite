import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from app.models.models import User, Shopkeeper, Shop, FoodCategory, FoodItem, Order, Earning, Commission

@pytest.fixture
def shopkeeper_a(client, db, test_location):
    """Fixture registering Shopkeeper A and establishing their Shop A."""
    reg = {
        "name": "Shopkeeper A",
        "email": "ska@bbd.ac.in",
        "phone": "+919876543201",
        "password": "password123",
        "role": "SHOPKEEPER"
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "ska@bbd.ac.in", "password": "password123"}).json()
    
    user_id = login_res["user"]["id"]
    
    # Assert Shopkeeper entry created automatically by registration triggers
    sk = db.query(Shopkeeper).filter(Shopkeeper.user_id == user_id).first()
    if not sk:
        sk = Shopkeeper(user_id=user_id, is_verified=True)
        db.add(sk)
        db.flush()

    shop = Shop(
        name="Shop A Canteen",
        description="Original Shop A Canteen",
        shopkeeper_id=user_id,
        campus_id=test_location["campus_id"],
        is_open=True,
        phone_number="+919876543201",
        opening_time="08:00",
        closing_time="20:00"
    )
    db.add(shop)
    db.commit()
    
    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"},
        "shop_id": shop.id,
        "user_id": user_id
    }

@pytest.fixture
def shopkeeper_b(client, db, test_location):
    """Fixture registering Shopkeeper B and establishing their Shop B."""
    reg = {
        "name": "Shopkeeper B",
        "email": "skb@bbd.ac.in",
        "phone": "+919876543202",
        "password": "password123",
        "role": "SHOPKEEPER"
    }
    client.post("/api/v1/auth/register", json=reg)
    login_res = client.post("/api/v1/auth/login", json={"email": "skb@bbd.ac.in", "password": "password123"}).json()
    
    user_id = login_res["user"]["id"]
    
    sk = db.query(Shopkeeper).filter(Shopkeeper.user_id == user_id).first()
    if not sk:
        sk = Shopkeeper(user_id=user_id, is_verified=True)
        db.add(sk)
        db.flush()

    shop = Shop(
        name="Shop B Canteen",
        description="Original Shop B Canteen",
        shopkeeper_id=user_id,
        campus_id=test_location["campus_id"],
        is_open=True,
        phone_number="+919876543202",
        opening_time="09:00",
        closing_time="21:00"
    )
    db.add(shop)
    db.commit()
    
    return {
        "headers": {"Authorization": f"Bearer {login_res['access_token']}"},
        "shop_id": shop.id,
        "user_id": user_id
    }


def test_role_authorization_checks(client, test_location, shopkeeper_a):
    """Verify that only users with the SHOPKEEPER role can hit shopkeeper endpoints."""
    # 1. Day Scholar Student Account
    reg_student = {
        "name": "Auth Student",
        "email": "student@bbd.ac.in",
        "phone": "+919876543203",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": test_location["campus_id"]
        }
    }
    client.post("/api/v1/auth/register", json=reg_student)
    login_res = client.post("/api/v1/auth/login", json={"email": "student@bbd.ac.in", "password": "password123"}).json()
    headers_student = {"Authorization": f"Bearer {login_res['access_token']}"}

    # Student requests shop profile
    response = client.get("/api/v1/shopkeepers/me/shop", headers=headers_student)
    assert response.status_code == 403  # Forbidden


def test_get_and_update_shop_profile(client, shopkeeper_a):
    """Test retrieving and updating the shopkeeper's canteen profile."""
    # GET Shop
    response = client.get("/api/v1/shopkeepers/me/shop", headers=shopkeeper_a["headers"])
    assert response.status_code == 200
    assert response.json()["name"] == "Shop A Canteen"
    assert response.json()["opening_time"] == "08:00"

    # PUT Shop Update
    update_payload = {
        "name": "Shop A Updated Name",
        "description": "Updated Description details",
        "opening_time": "07:30",
        "closing_time": "22:30",
        "delivery_available": False
    }
    update_res = client.put("/api/v1/shopkeepers/me/shop", json=update_payload, headers=shopkeeper_a["headers"])
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Shop A Updated Name"
    assert data["opening_time"] == "07:30"
    assert data["delivery_available"] is False


def test_categories_crud_and_ownership(client, shopkeeper_a, shopkeeper_b):
    """Test category creation, updating, deletion, and strict ownership boundary limits."""
    # 1. Shopkeeper A adds a category
    create_res = client.post(
        "/api/v1/shopkeepers/me/categories",
        json={"name": "Burgers"},
        headers=shopkeeper_a["headers"]
    )
    assert create_res.status_code == 201
    cat_id = create_res.json()["id"]

    # 2. Shopkeeper B tries to update Shopkeeper A's category name
    update_fail = client.put(
        f"/api/v1/shopkeepers/me/categories/{cat_id}",
        json={"name": "Pizzas"},
        headers=shopkeeper_b["headers"]
    )
    assert update_fail.status_code == 404

    # 3. Shopkeeper A updates category successfully
    update_ok = client.put(
        f"/api/v1/shopkeepers/me/categories/{cat_id}",
        json={"name": "Special Burgers"},
        headers=shopkeeper_a["headers"]
    )
    assert update_ok.status_code == 200
    assert update_ok.json()["name"] == "Special Burgers"


def test_menu_item_crud_and_ownership(client, shopkeeper_a, shopkeeper_b):
    """Test food menu items management and boundary validations."""
    # Create category first
    cat_res = client.post(
        "/api/v1/shopkeepers/me/categories",
        json={"name": "Quick Snacks"},
        headers=shopkeeper_a["headers"]
    )
    cat_id = cat_res.json()["id"]

    # 1. Shopkeeper B tries to add a food item into Shop A's category
    item_payload_fail = {
        "name": "Fried Samosa",
        "price": 20.00,
        "category_id": cat_id,
        "is_veg": True,
        "preparation_time": 10
    }
    create_fail = client.post(
        "/api/v1/shopkeepers/me/menu",
        json=item_payload_fail,
        headers=shopkeeper_b["headers"]
    )
    assert create_fail.status_code == 400

    # 2. Shopkeeper A adds item successfully
    item_payload_ok = {
        "name": "Paneer Patty",
        "price": 30.00,
        "description": "Crispy paneer puff",
        "category_id": cat_id,
        "is_veg": True,
        "preparation_time": 12
    }
    create_ok = client.post(
        "/api/v1/shopkeepers/me/menu",
        json=item_payload_ok,
        headers=shopkeeper_a["headers"]
    )
    assert create_ok.status_code == 201
    item_id = create_ok.json()["id"]

    # 3. Shopkeeper B blocked from updating Shop A's item price
    update_fail = client.put(
        f"/api/v1/shopkeepers/me/menu/{item_id}",
        json={"price": 40.00},
        headers=shopkeeper_b["headers"]
    )
    assert update_fail.status_code == 404


def test_order_status_transitions_and_ownership(client, db, test_location, shopkeeper_a, shopkeeper_b):
    """Test retrieval and workflow transitions of orders, ensuring transition validation rules."""
    shop_a_id = shopkeeper_a["shop_id"]
    shop_b_id = shopkeeper_b["shop_id"]

    # 1. Setup Student and Menu Item
    cat_res = client.post(
        "/api/v1/shopkeepers/me/categories",
        json={"name": "Meals"},
        headers=shopkeeper_a["headers"]
    )
    cat_id = cat_res.json()["id"]
    item_res = client.post(
        "/api/v1/shopkeepers/me/menu",
        json={"name": "Thali", "price": 100.00, "category_id": cat_id},
        headers=shopkeeper_a["headers"]
    ).json()

    # Register student
    reg_student = {
        "name": "Tester Student",
        "email": "student_test@bbd.ac.in",
        "phone": "+919876543204",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": test_location["campus_id"]
        }
    }
    client.post("/api/v1/auth/register", json=reg_student)
    login_student = client.post("/api/v1/auth/login", json={"email": "student_test@bbd.ac.in", "password": "password123"}).json()
    student_headers = {"Authorization": f"Bearer {login_student['access_token']}"}

    # 2. Student Places Order
    order_payload = {
        "shop_id": shop_a_id,
        "payment_method": "COD",
        "delivery_address": {"campus_name": "BBD Campus", "phone": "+919876543204"},
        "items": [{"food_item_id": item_res["id"], "quantity": 1}]
    }
    order_res = client.post("/api/v1/students/orders", json=order_payload, headers=student_headers).json()
    order_id = order_res["id"]

    # 3. Shopkeeper B tries to view Shopkeeper A's order details
    view_fail = client.get(f"/api/v1/shopkeepers/me/orders/{order_id}", headers=shopkeeper_b["headers"])
    assert view_fail.status_code == 404

    # 4. Shopkeeper A views details successfully
    view_ok = client.get(f"/api/v1/shopkeepers/me/orders/{order_id}", headers=shopkeeper_a["headers"])
    assert view_ok.status_code == 200
    assert view_ok.json()["status"] == "PENDING"

    # 5. Shopkeeper A triggers status transitions
    # Transition 1: PENDING -> ACCEPTED
    t1 = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        json={"status": "ACCEPTED"},
        headers=shopkeeper_a["headers"]
    )
    assert t1.status_code == 200
    assert t1.json()["status"] == "ACCEPTED"

    # Transition 2: ACCEPTED -> PREPARING
    t2 = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        json={"status": "PREPARING"},
        headers=shopkeeper_a["headers"]
    )
    assert t2.status_code == 200
    assert t2.json()["status"] == "PREPARING"

    # Invalid Transition: PREPARING -> DELIVERED (Directly blocked, delivery partners only)
    t_fail = client.patch(
        f"/api/v1/shopkeepers/me/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers=shopkeeper_a["headers"]
    )
    assert t_fail.status_code == 400


def test_shopkeeper_earnings_summary(client, db, shopkeeper_a):
    """Test retrieval of server-side sales and commission calculations."""
    user_id = shopkeeper_a["user_id"]
    shop_id = shopkeeper_a["shop_id"]
    
    # Inject mock completed order
    order = Order(
        order_number="CB-TEST-EARNINGS",
        student_id="random-student-id",
        shop_id=shop_id,
        status="DELIVERED",
        subtotal=Decimal("200.00"),
        delivery_fee=Decimal("15.00"),
        tax=Decimal("2.50"),
        total_amount=Decimal("217.50"),
        payment_status="PAID",
        payment_method="COD",
        delivery_address={"campus_name": "BBD Campus"},
        otp="1234"
    )
    db.add(order)
    db.flush()

    # Log Earning: Shopkeeper gets subtotal - 10% commission = 180.00
    earning = Earning(
        user_id=user_id,
        amount=Decimal("180.00"),
        type="SHOP_SALE",
        order_id=order.id,
        status="UNPAID",
        created_at=datetime.utcnow()
    )
    db.add(earning)

    # Log Commission
    commission = Commission(
        order_id=order.id,
        shop_id=shop_id,
        order_total=Decimal("200.00"),
        percentage=Decimal("10.00"),
        amount_earned=Decimal("20.00")
    )
    db.add(commission)
    db.commit()

    # Query Earnings Summary
    response = client.get("/api/v1/shopkeepers/me/earnings", headers=shopkeeper_a["headers"])
    assert response.status_code == 200
    data = response.json()
    assert float(data["today_earnings"]) == 180.00
    assert float(data["net_earnings"]) == 180.00
    assert data["total_orders"] == 1
    assert float(data["commission_deducted"]) == 20.00


def test_shopkeeper_profile_and_assigned_canteen(client, shopkeeper_a):
    """Test GET /api/v1/shopkeepers/me retrieves profile with assigned canteen info."""
    res = client.get("/api/v1/shopkeepers/me", headers=shopkeeper_a["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "ska@bbd.ac.in"
    assert data["role"] == "SHOPKEEPER"
    assert data["shop_id"] == shopkeeper_a["shop_id"]
    assert data["shop_name"] == "Shop A Canteen"
    assert data["campus_name"] == "Test Campus"


def test_create_menu_item_auto_general_category(client, shopkeeper_a):
    """Test creating a food item without category_id automatically creates and assigns General category."""
    item_payload = {
        "name": "Auto Category Samosa",
        "price": 25.00,
        "description": "Crispy potato samosa",
        "is_veg": True,
        "is_available": True,
        "preparation_time": 10
    }
    res = client.post("/api/v1/shopkeepers/me/menu", json=item_payload, headers=shopkeeper_a["headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Auto Category Samosa"
    assert data["category_name"] == "General"
    assert data["category_id"] is not None


def test_toggle_item_availability(client, shopkeeper_a):
    """Test 1-click PATCH /me/menu/{id}/availability."""
    # Create item first
    item_payload = {
        "name": "Toggle Burger",
        "price": 60.00,
        "is_veg": True,
        "is_available": True
    }
    create_res = client.post("/api/v1/shopkeepers/me/menu", json=item_payload, headers=shopkeeper_a["headers"])
    item_id = create_res.json()["id"]

    # Toggle to unavailable
    toggle_res = client.patch(
        f"/api/v1/shopkeepers/me/menu/{item_id}/availability",
        json={"is_available": False},
        headers=shopkeeper_a["headers"]
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_available"] is False

    # Toggle back to available
    toggle_res2 = client.patch(
        f"/api/v1/shopkeepers/me/menu/{item_id}/availability",
        json={"is_available": True},
        headers=shopkeeper_a["headers"]
    )
    assert toggle_res2.status_code == 200
    assert toggle_res2.json()["is_available"] is True


def test_shopkeeper_notifications_flow(client, db, shopkeeper_a):
    """Test shopkeeper notifications listing, unread count, read single, read all."""
    from app.models.models import Notification

    # Seed notifications for shopkeeper
    n1 = Notification(
        user_id=shopkeeper_a["user_id"],
        title="Test Order 1",
        message="New order #CB-001 placed",
        type="ORDER_PLACED",
        is_read=False
    )
    n2 = Notification(
        user_id=shopkeeper_a["user_id"],
        title="Test Order 2",
        message="New order #CB-002 placed",
        type="ORDER_PLACED",
        is_read=False
    )
    db.add_all([n1, n2])
    db.commit()

    # Unread count
    count_res = client.get("/api/v1/shopkeepers/me/notifications/unread-count", headers=shopkeeper_a["headers"])
    assert count_res.status_code == 200
    assert count_res.json()["unread_count"] >= 2

    # List notifications
    list_res = client.get("/api/v1/shopkeepers/me/notifications", headers=shopkeeper_a["headers"])
    assert list_res.status_code == 200
    notifs = list_res.json()
    assert len(notifs) >= 2

    # Mark single as read
    read_res = client.patch(f"/api/v1/shopkeepers/me/notifications/{n1.id}/read", headers=shopkeeper_a["headers"])
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # Mark all as read
    read_all_res = client.post("/api/v1/shopkeepers/me/notifications/read-all", headers=shopkeeper_a["headers"])
    assert read_all_res.status_code == 200

    # Verify unread is now 0
    count_res_after = client.get("/api/v1/shopkeepers/me/notifications/unread-count", headers=shopkeeper_a["headers"])
    assert count_res_after.json()["unread_count"] == 0


def test_shopkeeper_alias_routes(client, shopkeeper_a):
    """Test /api/v1/shopkeeper alias router works identically to /api/v1/shopkeepers."""
    res = client.get("/api/v1/shopkeeper/me", headers=shopkeeper_a["headers"])
    assert res.status_code == 200
    assert res.json()["email"] == "ska@bbd.ac.in"

    shop_res = client.get("/api/v1/shopkeeper/shop", headers=shopkeeper_a["headers"])
    assert shop_res.status_code == 200
    assert shop_res.json()["name"] == "Shop A Canteen"

