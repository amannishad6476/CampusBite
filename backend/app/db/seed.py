import sys
import os
from decimal import Decimal

# Add root folder to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.models import (
    User, Student, Shopkeeper, DeliveryPartner, City, Campus, College, Block, Hostel,
    Shop, FoodCategory, FoodItem, Cart, CartItem, Order, OrderItem, Payment, Delivery, Coupon,
    Review, Notification, Complaint, Commission, Earning
)
from app.core.security import get_password_hash

def seed_db():
    # Automatically create tables if they do not exist
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Clearing database tables...")
        # Clear in reverse order of foreign keys
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(CartItem).delete()
        db.query(Cart).delete()
        db.query(FoodItem).delete()
        db.query(FoodCategory).delete()
        db.query(Shop).delete()
        db.query(Commission).delete()
        db.query(Earning).delete()
        db.query(Complaint).delete()
        db.query(Review).delete()
        db.query(Delivery).delete()
        db.query(Payment).delete()
        db.query(Notification).delete()
        db.query(Coupon).delete()
        db.query(Student).delete()
        db.query(Shopkeeper).delete()
        db.query(DeliveryPartner).delete()
        db.query(User).delete()
        db.query(Block).delete()
        db.query(Hostel).delete()
        db.query(College).delete()
        db.query(Campus).delete()
        db.query(City).delete()
        db.commit()

        print("Seeding locations...")
        # City
        lucknow = City(name="Lucknow", state="Uttar Pradesh")
        db.add(lucknow)
        db.flush()

        # Campus
        bbd_campus = Campus(name="BBD University Campus", address="Faizabad Road, Lucknow", city_id=lucknow.id)
        db.add(bbd_campus)
        db.flush()

        # Colleges
        colleges = [
            College(name="BBDNIIT", campus_id=bbd_campus.id),
            College(name="BBDNITM", campus_id=bbd_campus.id),
            College(name="BBDCOE", campus_id=bbd_campus.id),
            College(name="BBDU", campus_id=bbd_campus.id)
        ]
        for col in colleges:
            db.add(col)
        db.flush()

        # Blocks
        bbdniit = colleges[0]
        bbdco = colleges[2]
        blocks = [
            Block(name="Block A (Main Block)", college_id=bbdniit.id, campus_id=bbd_campus.id),
            Block(name="Block B (CS/IT Block)", college_id=bbdniit.id, campus_id=bbd_campus.id),
            Block(name="Block C (Mechanical Block)", college_id=bbdniit.id, campus_id=bbd_campus.id),
            Block(name="Block D (Pharmacy Block)", college_id=bbdco.id, campus_id=bbd_campus.id),
            Block(name="Block E (MBA Block)", college_id=colleges[3].id, campus_id=bbd_campus.id),
            Block(name="Block F (Dental Block)", college_id=None, campus_id=bbd_campus.id)
        ]
        for blk in blocks:
            db.add(blk)
        db.flush()

        # Hostels
        hostels = [
            Hostel(name="Shastri Boys Hostel", campus_id=bbd_campus.id),
            Hostel(name="Sarojini Girls Hostel", campus_id=bbd_campus.id),
            Hostel(name="Tagore Boys Hostel", campus_id=bbd_campus.id)
        ]
        for hst in hostels:
            db.add(hst)
        db.flush()

        print("Seeding users...")
        # Create a shopkeeper user
        sk_user = User(
            name="Aman Shopkeeper",
            email="shopkeeper@bbd.ac.in",
            phone="+919876543299",
            password_hash=get_password_hash("shopkeeperpassword"),
            role="SHOPKEEPER"
        )
        db.add(sk_user)
        db.flush()

        shopkeeper = Shopkeeper(user_id=sk_user.id, is_verified=True)
        db.add(shopkeeper)
        db.flush()

        # Create a delivery partner user
        dp_user = User(
            name="Aman Delivery",
            email="delivery@bbd.ac.in",
            phone="+919876543298",
            password_hash=get_password_hash("deliverypassword"),
            role="DELIVERY_PARTNER"
        )
        db.add(dp_user)
        db.flush()

        delivery_partner = DeliveryPartner(
            user_id=dp_user.id,
            vehicle_type="Bicycle",
            vehicle_number="UP32-TEST-1234",
            is_active=True,
            is_verified=True
        )
        db.add(delivery_partner)
        db.flush()

        print("Seeding canteens and menu items...")
        # Shop 1
        shop1 = Shop(
            name="Block A Main Canteen",
            description="Hot Samosas, tea, coffee, and delicious quick meals.",
            shopkeeper_id=shopkeeper.user_id,
            campus_id=bbd_campus.id,
            rating=Decimal("4.3"),
            is_open=True,
            phone_number="+919876543299",
            opening_time="08:00",
            closing_time="20:00",
            delivery_available=True
        )
        db.add(shop1)
        
        # Shop 2
        shop2 = Shop(
            name="BBD Central Cafeteria",
            description="Premium wood-fired pizzas, shakes, wraps, and burgers.",
            shopkeeper_id=shopkeeper.user_id,
            campus_id=bbd_campus.id,
            rating=Decimal("4.6"),
            is_open=True,
            phone_number="+919876543297",
            opening_time="09:00",
            closing_time="22:00",
            delivery_available=True
        )
        db.add(shop2)
        db.flush()

        # Categories
        cat1 = FoodCategory(name="Quick Bites", shop_id=shop1.id)
        cat2 = FoodCategory(name="Beverages", shop_id=shop1.id)
        cat3 = FoodCategory(name="Pizzas & Burgers", shop_id=shop2.id)
        db.add(cat1)
        db.add(cat2)
        db.add(cat3)
        db.flush()

        # Food items
        food_items = [
            FoodItem(name="Samosa (Single)", price=Decimal("15.00"), is_veg=True, is_available=True, category_id=cat1.id, shop_id=shop1.id, description="Fried potato filled pastry.", preparation_time=10),
            FoodItem(name="Paneer Patty", price=Decimal("25.00"), is_veg=True, is_available=True, category_id=cat1.id, shop_id=shop1.id, description="Baked crisp puff with paneer.", preparation_time=12),
            FoodItem(name="Masala Chai", price=Decimal("10.00"), is_veg=True, is_available=True, category_id=cat2.id, shop_id=shop1.id, description="Brewed milk tea with spices.", preparation_time=5),
            FoodItem(name="Cold Coffee", price=Decimal("40.00"), is_veg=True, is_available=True, category_id=cat2.id, shop_id=shop1.id, description="Sweet chilled milk coffee.", preparation_time=8),
            FoodItem(name="Veg Cheese Pizza (8 inch)", price=Decimal("120.00"), is_veg=True, is_available=True, category_id=cat3.id, shop_id=shop2.id, description="Oven fresh cheese pizza.", preparation_time=15),
            FoodItem(name="Double Patty Veg Burger", price=Decimal("70.00"), is_veg=True, is_available=True, category_id=cat3.id, shop_id=shop2.id, description="Double patty crispy burger.", preparation_time=12)
        ]
        for item in food_items:
            db.add(item)
        
        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
