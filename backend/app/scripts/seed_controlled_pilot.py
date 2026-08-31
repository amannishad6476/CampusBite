import sys
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, Student, Shopkeeper, DeliveryPartner, City, Campus, College,
    Block, Hostel, Shop, FoodCategory, FoodItem
)

def seed_controlled_pilot_dataset(db: Session) -> dict:
    """
    Seeds a controlled initial pilot environment:
    - 1 College (BBD University)
    - 2 Academic Blocks & 2 Hostels
    - 2 Approved Active Canteens (Central Cafeteria & Campus Bakery)
    - 10 Test Students
    - 3 Delivery Partners
    - 1 Admin
    """
    # 1. City & Campus
    city = db.query(City).filter(City.name == "Lucknow").first()
    if not city:
        city = City(name="Lucknow", state="Uttar Pradesh")
        db.add(city)
        db.flush()

    campus = db.query(Campus).filter(Campus.name == "BBD Educational Campus").first()
    if not campus:
        campus = Campus(
            name="BBD Educational Campus",
            address="Faizabad Road, Lucknow, Uttar Pradesh 226028",
            city_id=city.id
        )
        db.add(campus)
        db.flush()

    # 2. 1 Primary College
    college = db.query(College).filter(College.name == "BBD University (BBDU)").first()
    if not college:
        college = College(name="BBD University (BBDU)", campus_id=campus.id)
        db.add(college)
        db.flush()

    # 3. 2 Blocks
    block_academic = db.query(Block).filter(Block.name == "Main Academic Block").first()
    if not block_academic:
        block_academic = Block(name="Main Academic Block", campus_id=campus.id, college_id=college.id)
        db.add(block_academic)
        db.flush()

    block_science = db.query(Block).filter(Block.name == "Science Block").first()
    if not block_science:
        block_science = Block(name="Science Block", campus_id=campus.id, college_id=college.id)
        db.add(block_science)
        db.flush()

    # 4. 2 Hostels
    hostel_boys = db.query(Hostel).filter(Hostel.name == "Tagore Boys Hostel").first()
    if not hostel_boys:
        hostel_boys = Hostel(name="Tagore Boys Hostel", campus_id=campus.id)
        db.add(hostel_boys)
        db.flush()

    hostel_girls = db.query(Hostel).filter(Hostel.name == "Gargi Girls Hostel").first()
    if not hostel_girls:
        hostel_girls = Hostel(name="Gargi Girls Hostel", campus_id=campus.id)
        db.add(hostel_girls)
        db.flush()

    # 5. Super Admin
    admin = db.query(User).filter(User.email == "admin@campusbite.com").first()
    if not admin:
        admin = User(
            name="CampusBite Pilot Admin",
            email="admin@campusbite.com",
            phone="+919876500000",
            password_hash=get_password_hash("AdminPass123!"),
            role="ADMIN",
            is_active=True
        )
        db.add(admin)
        db.flush()

    # 6. 2 Approved Pilot Canteens
    canteen_configs = [
        {
            "name": "Central Cafeteria",
            "email": "central.cafeteria@campusbite.com",
            "phone": "+919876510001",
            "vendor_name": "Chef Ramesh",
            "items": [
                ("Aloo Tikki Burger", Decimal("50.00"), "Snacks", True, 8),
                ("Paneer Cheese Roll", Decimal("90.00"), "Snacks", True, 10),
                ("Special Masala Dosa", Decimal("80.00"), "Meals", True, 12),
                ("Cold Coffee", Decimal("50.00"), "Beverages", True, 5),
            ]
        },
        {
            "name": "Campus Bakery & Cafe",
            "email": "bakery.cafe@campusbite.com",
            "phone": "+919876510002",
            "vendor_name": "Baker Priya",
            "items": [
                ("Grilled Cheese Sandwich", Decimal("60.00"), "Quick Bites", True, 7),
                ("Veg Club Sandwich", Decimal("75.00"), "Quick Bites", True, 8),
                ("Choco Lava Cake", Decimal("45.00"), "Desserts", True, 5),
                ("Fresh Lemon Soda", Decimal("35.00"), "Beverages", True, 3),
            ]
        }
    ]

    created_shops = []
    for c_conf in canteen_configs:
        sk_user = db.query(User).filter(User.email == c_conf["email"]).first()
        if not sk_user:
            sk_user = User(
                name=c_conf["vendor_name"],
                email=c_conf["email"],
                phone=c_conf["phone"],
                password_hash=get_password_hash("ShopPass123!"),
                role="SHOPKEEPER",
                is_active=True
            )
            db.add(sk_user)
            db.flush()
            db.add(Shopkeeper(user_id=sk_user.id, is_verified=True))
            db.flush()

        shop = db.query(Shop).filter(Shop.name == c_conf["name"]).first()
        if not shop:
            shop = Shop(
                name=c_conf["name"],
                description=f"Fresh quality food at {college.name}",
                shopkeeper_id=sk_user.id,
                campus_id=campus.id,
                status="ACTIVE",
                is_open=True,
                rating=Decimal("4.9"),
                phone_number=c_conf["phone"],
                opening_time="08:00 AM",
                closing_time="10:00 PM"
            )
            db.add(shop)
            db.flush()

            # Create categories & items
            categories_map = {}
            for item_name, price, cat_name, is_veg, prep_time in c_conf["items"]:
                if cat_name not in categories_map:
                    cat = FoodCategory(name=cat_name, shop_id=shop.id)
                    db.add(cat)
                    db.flush()
                    categories_map[cat_name] = cat

                f_item = FoodItem(
                    name=item_name,
                    price=price,
                    category_id=categories_map[cat_name].id,
                    shop_id=shop.id,
                    is_veg=is_veg,
                    is_available=True,
                    preparation_time=prep_time
                )
                db.add(f_item)

        created_shops.append(shop)

    # 7. 3 Delivery Partners
    rider_configs = [
        {"name": "Vikas Rider", "email": "rider.vikas@campusbite.com", "phone": "+919876520001", "vehicle": "Electric Scooter", "plate": "UP32-CB-001"},
        {"name": "Ankit Rider", "email": "rider.ankit@campusbite.com", "phone": "+919876520002", "vehicle": "Bicycle", "plate": "UP32-CB-002"},
        {"name": "Deepak Rider", "email": "rider.deepak@campusbite.com", "phone": "+919876520003", "vehicle": "Motorcycle", "plate": "UP32-CB-003"},
    ]
    created_riders = []
    for r_info in rider_configs:
        r_user = db.query(User).filter(User.email == r_info["email"]).first()
        if not r_user:
            r_user = User(
                name=r_info["name"],
                email=r_info["email"],
                phone=r_info["phone"],
                password_hash=get_password_hash("RiderPass123!"),
                role="DELIVERY_PARTNER",
                is_active=True
            )
            db.add(r_user)
            db.flush()
            dp_prof = DeliveryPartner(
                user_id=r_user.id,
                vehicle_type=r_info["vehicle"],
                vehicle_number=r_info["plate"],
                is_active=True
            )
            db.add(dp_prof)
            db.flush()
        created_riders.append(r_user)

    # 8. 10 Test Students
    created_students = []
    for i in range(1, 11):
        s_email = f"student{i}@bbd.ac.in"
        s_user = db.query(User).filter(User.email == s_email).first()
        if not s_user:
            s_user = User(
                name=f"Student User {i}",
                email=s_email,
                phone=f"+9198765300{i:02d}",
                password_hash=get_password_hash("StudentPass123!"),
                role="STUDENT",
                is_active=True
            )
            db.add(s_user)
            db.flush()

            is_hosteler = (i % 2 == 0)
            s_prof = Student(
                user_id=s_user.id,
                campus_id=campus.id,
                college_id=college.id,
                block_id=block_academic.id if not is_hosteler else None,
                hostel_id=hostel_boys.id if (is_hosteler and i <= 6) else (hostel_girls.id if is_hosteler else None),
                room_number=f"{100 + i}",
                floor_level="1st Floor" if i <= 5 else "2nd Floor",
                is_hosteler=is_hosteler
            )
            db.add(s_prof)
            db.flush()
        created_students.append(s_user)

    db.commit()
    return {
        "status": "success",
        "campus": campus.name,
        "college": college.name,
        "blocks": [block_academic.name, block_science.name],
        "hostels": [hostel_boys.name, hostel_girls.name],
        "shops_count": len(created_shops),
        "students_count": len(created_students),
        "riders_count": len(created_riders),
    }

if __name__ == "__main__":
    db = SessionLocal()
    try:
        res = seed_controlled_pilot_dataset(db)
        print("Controlled pilot dataset successfully initialized:", res)
    finally:
        db.close()
