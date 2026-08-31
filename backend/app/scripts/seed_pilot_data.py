import sys
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, Student, Shopkeeper, DeliveryPartner, City, Campus, College,
    Block, Hostel, Shop, FoodCategory, FoodItem
)

def seed_pilot_dataset(db: Session) -> dict:
    """
    Seeds a realistic 6-college campus pilot environment with:
    - 1 Main Campus
    - 6 Real Colleges with academic blocks and residential hostels
    - 6 Approved Canteens with rich food categories and menu items
    - Pilot accounts for Admin, Students, Shopkeepers, and Delivery Partners
    """
    # 1. City & Main Campus
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

    # 2. 6 Colleges
    colleges_data = [
        {"name": "BBD University (BBDU)", "block": "Main Academic Block"},
        {"name": "BBD National Institute of Technology and Management (BBDNITM)", "block": "Engineering Block A"},
        {"name": "BBD Northern India Institute of Technology (BBDNIIT)", "block": "Tech Wing B"},
        {"name": "BBD College of Dental Sciences (BBDCODS)", "block": "Clinical Sciences Wing"},
        {"name": "BBD Institute of Hotel Management (BBDIHM)", "block": "Culinary Arts Block"},
        {"name": "BBD School of Pharmacy (BBDSP)", "block": "Pharmaceutical Research Wing"},
    ]

    colleges = []
    blocks = []
    for c_info in colleges_data:
        college = db.query(College).filter(College.name == c_info["name"]).first()
        if not college:
            college = College(name=c_info["name"], campus_id=campus.id)
            db.add(college)
            db.flush()
        colleges.append(college)

        block = db.query(Block).filter(Block.name == c_info["block"]).first()
        if not block:
            block = Block(name=c_info["block"], campus_id=campus.id, college_id=college.id)
            db.add(block)
            db.flush()
        blocks.append(block)

    # 3. Hostels
    hostels_data = [
        {"name": "Tagore Boys Hostel", "type": "BOYS"},
        {"name": "Gargi Girls Hostel", "type": "GIRLS"},
        {"name": "Raman Boys Hostel", "type": "BOYS"},
        {"name": "Sarojini Girls Hostel", "type": "GIRLS"},
    ]
    hostels = []
    for h_info in hostels_data:
        hostel = db.query(Hostel).filter(Hostel.name == h_info["name"]).first()
        if not hostel:
            hostel = Hostel(name=h_info["name"], campus_id=campus.id)
            db.add(hostel)
            db.flush()
        hostels.append(hostel)

    # 4. Create Core Pilot Users
    # A. Super Admin
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

    # B. Pilot Delivery Partner
    rider = db.query(User).filter(User.email == "rider1@campusbite.com").first()
    if not rider:
        rider = User(
            name="Rahul Rider",
            email="rider1@campusbite.com",
            phone="+919876500001",
            password_hash=get_password_hash("RiderPass123!"),
            role="DELIVERY_PARTNER",
            is_active=True
        )
        db.add(rider)
        db.flush()
        rider_prof = DeliveryPartner(
            user_id=rider.id,
            vehicle_type="Electric Scooter",
            vehicle_number="UP32-CB-2026",
            is_active=True
        )
        db.add(rider_prof)
        db.flush()

    # C. Pilot Student
    student = db.query(User).filter(User.email == "student1@campusbite.com").first()
    if not student:
        student = User(
            name="Aman Student",
            email="student1@campusbite.com",
            phone="+919876500002",
            password_hash=get_password_hash("StudentPass123!"),
            role="STUDENT",
            is_active=True
        )
        db.add(student)
        db.flush()
        student_prof = Student(
            user_id=student.id,
            campus_id=campus.id,
            college_id=colleges[0].id,
            block_id=blocks[0].id,
            hostel_id=hostels[0].id,
            room_number="302",
            floor_level="3rd Floor",
            is_hosteler=True
        )
        db.add(student_prof)
        db.flush()

    # 5. Create 6 Approved Pilot Shops (one per college)
    shops_info = [
        {"name": "Central Cafeteria", "college": colleges[0], "phone": "+919876500101"},
        {"name": "Engineering Food Court", "college": colleges[1], "phone": "+919876500102"},
        {"name": "NIIT Express Bites", "college": colleges[2], "phone": "+919876500103"},
        {"name": "Dental Campus Cafe", "college": colleges[3], "phone": "+919876500104"},
        {"name": "Gourmet Hub", "college": colleges[4], "phone": "+919876500105"},
        {"name": "Medico Fast Bites", "college": colleges[5], "phone": "+919876500106"},
    ]

    created_shops = []
    for idx, s_info in enumerate(shops_info, start=1):
        sk_email = f"shopkeeper{idx}@campusbite.com"
        sk_user = db.query(User).filter(User.email == sk_email).first()
        if not sk_user:
            sk_user = User(
                name=f"Chef Vendor {idx}",
                email=sk_email,
                phone=s_info["phone"],
                password_hash=get_password_hash("ShopPass123!"),
                role="SHOPKEEPER",
                is_active=True
            )
            db.add(sk_user)
            db.flush()
            db.add(Shopkeeper(user_id=sk_user.id, is_verified=True))
            db.flush()

        shop = db.query(Shop).filter(Shop.name == s_info["name"]).first()
        if not shop:
            shop = Shop(
                name=s_info["name"],
                description=f"Freshly prepared meals, snacks, and beverages for {s_info['college'].name}",
                shopkeeper_id=sk_user.id,
                campus_id=campus.id,
                status="ACTIVE",
                is_open=True,
                rating=Decimal("4.8"),
                phone_number=s_info["phone"],
                opening_time="08:00 AM",
                closing_time="10:00 PM"
            )
            db.add(shop)
            db.flush()

            # Add Menu Categories
            cat_snacks = FoodCategory(name="Quick Snacks", shop_id=shop.id)
            cat_meals = FoodCategory(name="Main Courses", shop_id=shop.id)
            cat_drinks = FoodCategory(name="Cold Beverages", shop_id=shop.id)
            db.add_all([cat_snacks, cat_meals, cat_drinks])
            db.flush()

            # Add Menu Items
            items = [
                FoodItem(name="Crispy Veg Burger", price=Decimal("60.00"), category_id=cat_snacks.id, shop_id=shop.id, is_veg=True, is_available=True, preparation_time=10),
                FoodItem(name="Paneer Tikka Roll", price=Decimal("110.00"), category_id=cat_snacks.id, shop_id=shop.id, is_veg=True, is_available=True, preparation_time=12),
                FoodItem(name="Executive Thali", price=Decimal("150.00"), category_id=cat_meals.id, shop_id=shop.id, is_veg=True, is_available=True, preparation_time=15),
                FoodItem(name="Cold Coffee with Ice Cream", price=Decimal("70.00"), category_id=cat_drinks.id, shop_id=shop.id, is_veg=True, is_available=True, preparation_time=5),
            ]
            db.add_all(items)

        created_shops.append(shop)

    db.commit()
    return {
        "status": "success",
        "campus": campus.name,
        "colleges_count": len(colleges),
        "blocks_count": len(blocks),
        "hostels_count": len(hostels),
        "shops_count": len(created_shops),
    }

if __name__ == "__main__":
    db = SessionLocal()
    try:
        res = seed_pilot_dataset(db)
        print("Pilot dataset successfully initialized:", res)
    finally:
        db.close()
