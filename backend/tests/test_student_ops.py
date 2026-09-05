import pytest
from decimal import Decimal
from fastapi import Depends
from app.models.models import User, Shopkeeper, Shop, FoodCategory, FoodItem
from app.core.security import get_password_hash

@pytest.fixture
def test_catalog(db, test_location):
    """Create a mock canteen catalog containing categories and items for student operations tests."""
    campus_id = test_location["campus_id"]
    
    # 1. Create a shopkeeper account
    sk_user = User(
        name="Test Shopkeeper",
        email="test_shopkeeper@bbd.ac.in",
        phone="+919876543199",
        password_hash=get_password_hash("password123"),
        role="SHOPKEEPER"
    )
    db.add(sk_user)
    db.flush()

    shopkeeper = Shopkeeper(user_id=sk_user.id, is_verified=True)
    db.add(shopkeeper)
    db.flush()

    # 2. Create a shop canteen
    shop = Shop(
        name="Test Canteen",
        description="A great canteen on campus",
        shopkeeper_id=shopkeeper.user_id,
        campus_id=campus_id,
        rating=Decimal("4.5"),
        is_open=True
    )
    db.add(shop)
    db.flush()

    # 3. Create a category
    category = FoodCategory(name="Burgers", shop_id=shop.id)
    db.add(category)
    db.flush()

    # 4. Create menu items
    item1 = FoodItem(
        name="Veg Burger",
        price=Decimal("50.00"),
        is_veg=True,
        is_available=True,
        category_id=category.id,
        shop_id=shop.id
    )
    item2 = FoodItem(
        name="Chicken Burger",
        price=Decimal("80.00"),
        is_veg=False,
        is_available=True,
        category_id=category.id,
        shop_id=shop.id
    )
    db.add(item1)
    db.add(item2)
    db.commit()

    return {
        "shop_id": shop.id,
        "category_id": category.id,
        "item1_id": item1.id,
        "item2_id": item2.id,
        "shopkeeper_id": shopkeeper.user_id
    }


def test_get_campuses(client, test_location):
    """Test retrieving all active campuses."""
    response = client.get("/api/v1/campuses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Campus"


def test_get_colleges(client, test_location):
    """Test retrieving colleges filtering by campus."""
    campus_id = test_location["campus_id"]
    response = client.get(f"/api/v1/colleges?campus_id={campus_id}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_shops(client, test_location, test_catalog):
    """Test retrieving active canteens on the student's campus."""
    campus_id = test_location["campus_id"]
    
    # Register and login student
    register_payload = {
        "name": "Auth Student",
        "email": "authstudent@bbd.ac.in",
        "phone": "+919876543110",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login_response = client.post("/api/v1/auth/login", json={
        "email": "authstudent@bbd.ac.in",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/v1/students/shops?campus_id={campus_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Canteen"


def test_get_menu(client, test_location, test_catalog):
    """Test fetching food menu items from a canteen."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    
    # Register and login student
    register_payload = {
        "name": "Menu Student",
        "email": "menustudent@bbd.ac.in",
        "phone": "+919876543180",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login_response = client.post("/api/v1/auth/login", json={
        "email": "menustudent@bbd.ac.in",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/v1/students/shops/{shop_id}/menu", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Veg Burger"


def test_place_order_success(client, test_location, test_catalog):
    """Test successful student order placement, validation, OTP, and history queries."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]
    
    # 1. Register and login student
    register_payload = {
        "name": "Order Student",
        "email": "orderstudent@bbd.ac.in",
        "phone": "+919876543111",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login_response = client.post("/api/v1/auth/login", json={
        "email": "orderstudent@bbd.ac.in",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Place Order (COD)
    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "block_name": "Block B",
            "floor_level": "1st",
            "room_number": "101",
            "phone": "+919876543111"
        },
        "items": [
            {
                "food_item_id": item1_id,
                "quantity": 2,
                "notes": "Extra cheese please"
            }
        ]
    }
    response = client.post("/api/v1/students/orders", json=order_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["order_number"].startswith("CB-")
    assert float(data["subtotal"]) == 100.00  # 50.00 * 2
    assert float(data["delivery_fee"]) == 15.00
    assert float(data["tax"]) == 2.50
    assert float(data["total_amount"]) == 117.50
    assert len(data["otp"]) == 4

    # 3. Retrieve student order history
    history_response = client.get("/api/v1/students/orders", headers=headers)
    assert history_response.status_code == 200
    assert len(history_response.json()) == 1

    # 4. Fetch specific order details
    order_id = data["id"]
    details_response = client.get(f"/api/v1/students/orders/{order_id}", headers=headers)
    assert details_response.status_code == 200
    assert details_response.json()["order_number"] == data["order_number"]


def test_order_details_ownership_enforced(client, test_location, test_catalog):
    """Test that students are forbidden from retrieving order details belonging to other students."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]

    # 1. Student A Registers and Places Order
    reg_a = {
        "name": "Student A",
        "email": "studenta@bbd.ac.in",
        "phone": "+919876543120",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=reg_a)
    login_a = client.post("/api/v1/auth/login", json={"email": "studenta@bbd.ac.in", "password": "password123"}).json()
    
    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "phone": "+919876543120"
        },
        "items": [{"food_item_id": item1_id, "quantity": 1}]
    }
    order_res = client.post(
        "/api/v1/students/orders",
        json=order_payload,
        headers={"Authorization": f"Bearer {login_a['access_token']}"}
    ).json()
    order_id = order_res["id"]

    # 2. Student B Registers and Tries to read Student A's order details
    reg_b = {
        "name": "Student B",
        "email": "studentb@bbd.ac.in",
        "phone": "+919876543121",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=reg_b)
    login_b = client.post("/api/v1/auth/login", json={"email": "studentb@bbd.ac.in", "password": "password123"}).json()

    response = client.get(
        f"/api/v1/students/orders/{order_id}",
        headers={"Authorization": f"Bearer {login_b['access_token']}"}
    )
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


def test_place_order_rejected_when_canteen_closed(client, test_location, test_catalog, db):
    """Test that student orders are rejected with HTTP 400 when the canteen is marked closed."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]

    # 1. Close the canteen
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    shop.is_open = False
    db.commit()

    # 2. Register and login student
    reg = {
        "name": "Closed Canteen Student",
        "email": "closedstudent@bbd.ac.in",
        "phone": "+919876543130",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {"campus_id": campus_id}
    }
    client.post("/api/v1/auth/register", json=reg)
    login = client.post("/api/v1/auth/login", json={"email": "closedstudent@bbd.ac.in", "password": "password123"}).json()

    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "phone": "+919876543130"
        },
        "items": [{"food_item_id": item1_id, "quantity": 1}]
    }
    response = client.post(
        "/api/v1/students/orders",
        json=order_payload,
        headers={"Authorization": f"Bearer {login['access_token']}"}
    )
    assert response.status_code == 400
    assert "This canteen is currently closed. Please try again when it is open." in response.json()["detail"]


def test_place_order_succeeds_after_reopening_canteen(client, test_location, test_catalog, db):
    """Test that reopening the canteen allows student orders to proceed normally."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]

    # 1. Ensure canteen is closed first
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    shop.is_open = False
    db.commit()

    # 2. Register & login student
    reg = {
        "name": "Reopen Student",
        "email": "reopenstudent@bbd.ac.in",
        "phone": "+919876543131",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {"campus_id": campus_id}
    }
    client.post("/api/v1/auth/register", json=reg)
    login = client.post("/api/v1/auth/login", json={"email": "reopenstudent@bbd.ac.in", "password": "password123"}).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}

    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "phone": "+919876543131"
        },
        "items": [{"food_item_id": item1_id, "quantity": 1}]
    }

    # Attempt order while closed -> Rejected
    res_closed = client.post("/api/v1/students/orders", json=order_payload, headers=headers)
    assert res_closed.status_code == 400

    # Reopen canteen
    shop.is_open = True
    db.commit()

    # Attempt order after reopening -> Success
    res_open = client.post("/api/v1/students/orders", json=order_payload, headers=headers)
    assert res_open.status_code == 201
    assert res_open.json()["order_number"].startswith("CB-")


def test_existing_orders_unaffected_by_canteen_closure(client, test_location, test_catalog, db):
    """Test that previously placed orders remain queryable and unaffected when the canteen is subsequently closed."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]

    # 1. Canteen is open
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    shop.is_open = True
    db.commit()

    reg = {
        "name": "Existing Order Student",
        "email": "existingorderstudent@bbd.ac.in",
        "phone": "+919876543132",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {"campus_id": campus_id}
    }
    client.post("/api/v1/auth/register", json=reg)
    login = client.post("/api/v1/auth/login", json={"email": "existingorderstudent@bbd.ac.in", "password": "password123"}).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}

    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "phone": "+919876543132"
        },
        "items": [{"food_item_id": item1_id, "quantity": 1}]
    }

    # Place order successfully
    res = client.post("/api/v1/students/orders", json=order_payload, headers=headers)
    assert res.status_code == 201
    order_id = res.json()["id"]

    # 2. Canteen is now CLOSED by shopkeeper
    shop.is_open = False
    db.commit()

    # 3. Existing order details can still be queried
    detail_res = client.get(f"/api/v1/students/orders/{order_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == order_id

    # 4. Student order history still contains the order
    history_res = client.get("/api/v1/students/orders", headers=headers)
    assert history_res.status_code == 200
    assert any(o["id"] == order_id for o in history_res.json())


def test_place_order_rejected_when_canteen_suspended(client, test_location, test_catalog, db):
    """Test that student orders are rejected when the canteen status is SUSPENDED."""
    campus_id = test_location["campus_id"]
    shop_id = test_catalog["shop_id"]
    item1_id = test_catalog["item1_id"]

    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    shop.is_open = True
    shop.status = "SUSPENDED"
    db.commit()

    reg = {
        "name": "Suspended Canteen Student",
        "email": "suspendedstudent@bbd.ac.in",
        "phone": "+919876543133",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {"campus_id": campus_id}
    }
    client.post("/api/v1/auth/register", json=reg)
    login = client.post("/api/v1/auth/login", json={"email": "suspendedstudent@bbd.ac.in", "password": "password123"}).json()

    order_payload = {
        "shop_id": shop_id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Test Campus",
            "phone": "+919876543133"
        },
        "items": [{"food_item_id": item1_id, "quantity": 1}]
    }
    response = client.post(
        "/api/v1/students/orders",
        json=order_payload,
        headers={"Authorization": f"Bearer {login['access_token']}"}
    )
    assert response.status_code == 400
    assert "This canteen is currently unavailable. Please try again later." in response.json()["detail"]
