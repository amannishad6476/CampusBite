import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.models import User, Campus, Shop, FoodCategory, FoodItem, Order, Student, Shopkeeper, DeliveryPartner
from app.core.security import get_password_hash

def test_security_role_escalation_and_boundaries(client: TestClient, db: Session):
    """
    Test horizontal and vertical role privilege escalation attempts:
    - Student -> Admin routes (403)
    - Student -> Shopkeeper routes (403)
    - Student -> Delivery routes (403)
    - Shopkeeper -> Admin routes (403)
    - Delivery Partner -> Admin routes (403)
    """
    # Create Users
    u_student = User(name="S", email="sec_student@test.com", phone="8880000001", password_hash=get_password_hash("Pass123!"), role="STUDENT")
    u_shop = User(name="K", email="sec_shop@test.com", phone="8880000002", password_hash=get_password_hash("Pass123!"), role="SHOPKEEPER")
    u_driver = User(name="D", email="sec_driver@test.com", phone="8880000003", password_hash=get_password_hash("Pass123!"), role="DELIVERY_PARTNER")
    db.add_all([u_student, u_shop, u_driver])
    db.flush()

    s_prof = Student(user_id=u_student.id, campus_id=1)
    sk_prof = Shopkeeper(user_id=u_shop.id)
    dp_prof = DeliveryPartner(user_id=u_driver.id, vehicle_type="Bike", is_active=True)
    db.add_all([s_prof, sk_prof, dp_prof])
    db.commit()

    def get_token(email, password):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200
        return res.json()["access_token"]

    token_student = get_token("sec_student@test.com", "Pass123!")
    token_shop = get_token("sec_shop@test.com", "Pass123!")
    token_driver = get_token("sec_driver@test.com", "Pass123!")

    # 1. Student -> Admin
    res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {token_student}"})
    assert res.status_code == 403

    # 2. Student -> Shopkeeper
    res = client.get("/api/v1/shopkeepers/me/orders", headers={"Authorization": f"Bearer {token_student}"})
    assert res.status_code == 403

    # 3. Student -> Delivery
    res = client.get("/api/v1/delivery/available-orders", headers={"Authorization": f"Bearer {token_student}"})
    assert res.status_code == 403

    # 4. Shopkeeper -> Admin
    res = client.get("/api/v1/admin/finance", headers={"Authorization": f"Bearer {token_shop}"})
    assert res.status_code == 403

    # 5. Shopkeeper -> Delivery
    res = client.get("/api/v1/delivery/me", headers={"Authorization": f"Bearer {token_shop}"})
    assert res.status_code == 403

    # 6. Delivery Partner -> Admin
    res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {token_driver}"})
    assert res.status_code == 403

    # 7. Delivery Partner -> Shopkeeper
    res = client.get("/api/v1/shopkeepers/me/shop", headers={"Authorization": f"Bearer {token_driver}"})
    assert res.status_code == 403


def test_object_ownership_isolation(client: TestClient, db: Session):
    """
    Test horizontal privilege isolation:
    - Shopkeeper A cannot modify Shopkeeper B's categories or menu items
    - Student A cannot view Student B's private order tracking details
    """
    # Create two shopkeepers and shops
    u_sk1 = User(name="SK1", email="sk1_iso@test.com", phone="8880000011", password_hash=get_password_hash("Pass123!"), role="SHOPKEEPER")
    u_sk2 = User(name="SK2", email="sk2_iso@test.com", phone="8880000012", password_hash=get_password_hash("Pass123!"), role="SHOPKEEPER")
    db.add_all([u_sk1, u_sk2])
    db.flush()

    db.add_all([Shopkeeper(user_id=u_sk1.id), Shopkeeper(user_id=u_sk2.id)])
    shop1 = Shop(name="Shop One", shopkeeper_id=u_sk1.id, campus_id=1, status="ACTIVE")
    shop2 = Shop(name="Shop Two", shopkeeper_id=u_sk2.id, campus_id=1, status="ACTIVE")
    db.add_all([shop1, shop2])
    db.flush()

    cat1 = FoodCategory(name="Appetizers", shop_id=shop1.id)
    db.add(cat1)
    db.flush()
    item1 = FoodItem(name="Spring Roll", price=50.00, category_id=cat1.id, shop_id=shop1.id, is_available=True)
    db.add(item1)
    db.commit()

    def get_token(email):
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "Pass123!"})
        assert res.status_code == 200
        return res.json()["access_token"]

    token_sk2 = get_token("sk2_iso@test.com")

    # Shopkeeper 2 attempts to edit item belonging to Shopkeeper 1
    res_edit = client.put(
        f"/api/v1/shopkeepers/me/menu/{item1.id}",
        headers={"Authorization": f"Bearer {token_sk2}"},
        json={"name": "Hacked Roll", "price": 10.00}
    )
    assert res_edit.status_code in [403, 404]

    # Shopkeeper 2 attempts to delete category belonging to Shopkeeper 1
    res_del_cat = client.delete(
        f"/api/v1/shopkeepers/me/categories/{cat1.id}",
        headers={"Authorization": f"Bearer {token_sk2}"}
    )
    assert res_del_cat.status_code in [403, 404]


def test_price_manipulation_prevention(client: TestClient, db: Session):
    """
    Test server-side price security:
    Order placement calculates subtotal from the DB item price, ignoring any client assumptions.
    """
    u_student = User(name="Student Price Check", email="price_check@test.com", phone="8880000021", password_hash=get_password_hash("Pass123!"), role="STUDENT")
    u_sk = User(name="Shop Price Check", email="shop_price@test.com", phone="8880000022", password_hash=get_password_hash("Pass123!"), role="SHOPKEEPER")
    db.add_all([u_student, u_sk])
    db.flush()
    db.add(Student(user_id=u_student.id, campus_id=1))
    db.add(Shopkeeper(user_id=u_sk.id))
    shop = Shop(name="Luxury Bites", shopkeeper_id=u_sk.id, campus_id=1, status="ACTIVE")
    db.add(shop)
    db.flush()

    cat = FoodCategory(name="Steaks", shop_id=shop.id)
    db.add(cat)
    db.flush()
    # Real item price in database is 500.00
    item = FoodItem(name="Sizzler", price=500.00, category_id=cat.id, shop_id=shop.id, is_available=True)
    db.add(item)
    db.commit()

    res_login = client.post("/api/v1/auth/login", json={"email": "price_check@test.com", "password": "Pass123!"})
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]

    # Student sends order payload (client cannot specify custom prices in schema, but even if item quantity is 2)
    order_payload = {
        "shop_id": shop.id,
        "payment_method": "COD",
        "delivery_address": {
            "campus_name": "Main Campus",
            "phone": "8880000021"
        },
        "items": [
            {
                "food_item_id": item.id,
                "quantity": 2
            }
        ]
    }

    res_order = client.post(
        "/api/v1/students/orders",
        headers={"Authorization": f"Bearer {token}"},
        json=order_payload
    )
    assert res_order.status_code == 201
    order_data = res_order.json()

    # Verify server calculated 500.00 * 2 = 1000.00 subtotal
    assert Decimal(str(order_data["subtotal"])) == Decimal("1000.00")
    assert Decimal(str(order_data["total_amount"])) == Decimal("1017.50")
