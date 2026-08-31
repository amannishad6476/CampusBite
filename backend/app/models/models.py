import uuid
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, Text, Numeric, ForeignKey, JSON
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # STUDENT, SHOPKEEPER, DELIVERY_PARTNER, ADMIN
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    shopkeeper = relationship("Shopkeeper", back_populates="user", uselist=False, cascade="all, delete-orphan")
    delivery_partner = relationship("DeliveryPartner", back_populates="user", uselist=False, cascade="all, delete-orphan")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    state = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)


class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)


class Student(Base):
    __tablename__ = "students"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="RESTRICT"), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True)
    block_id = Column(Integer, ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True)
    hostel_id = Column(Integer, ForeignKey("hostels.id", ondelete="SET NULL"), nullable=True)
    room_number = Column(String(20), nullable=True)
    floor_level = Column(String(20), nullable=True)
    is_hosteler = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student")


class Shopkeeper(Base):
    __tablename__ = "shopkeepers"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    bank_details = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="shopkeeper")


class DeliveryPartner(Base):
    __tablename__ = "delivery_partners"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    vehicle_type = Column(String(50), nullable=False)
    vehicle_number = Column(String(30), nullable=True)
    rating = Column(Numeric(3, 2), default=5.0, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    current_lat = Column(Numeric(10, 8), nullable=True)
    current_lng = Column(Numeric(11, 8), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="delivery_partner")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    shopkeeper_id = Column(String(36), ForeignKey("shopkeepers.user_id", ondelete="RESTRICT"), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="RESTRICT"), nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    rating = Column(Numeric(3, 2), default=5.0, nullable=False)
    phone_number = Column(String(20), nullable=True)
    opening_time = Column(String(20), nullable=True)
    closing_time = Column(String(20), nullable=True)
    delivery_available = Column(Boolean, default=True, nullable=False)
    status = Column(String(30), default="APPROVED", nullable=False)


class FoodCategory(Base):
    __tablename__ = "food_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(255), nullable=True)
    is_veg = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    category_id = Column(Integer, ForeignKey("food_categories.id", ondelete="RESTRICT"), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    preparation_time = Column(Integer, default=15, nullable=False)


class Cart(Base):
    __tablename__ = "carts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.user_id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id = Column(String(36), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(String(255), nullable=True)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(30), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), nullable=False)  # PERCENT, FLAT
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_order_value = Column(Numeric(10, 2), default=0.0, nullable=False)
    max_discount = Column(Numeric(10, 2), nullable=True)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="SET NULL"), nullable=True)
    active_from = Column(DateTime, nullable=False)
    active_to = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.user_id", ondelete="RESTRICT"), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(30), default="PLACED", nullable=False)  # PLACED, ACCEPTED, PREPARING, READY, TRANSIT, DELIVERED, CANCELLED
    subtotal = Column(Numeric(10, 2), nullable=False)
    delivery_fee = Column(Numeric(10, 2), default=0.0, nullable=False)
    discount = Column(Numeric(10, 2), default=0.0, nullable=False)
    tax = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), default="PENDING", nullable=False)  # PENDING, PAID, FAILED, REFUNDED
    payment_method = Column(String(20), nullable=False)  # COD, ONLINE
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)
    delivery_partner_id = Column(String(36), ForeignKey("delivery_partners.user_id", ondelete="SET NULL"), nullable=True)
    delivery_address = Column(JSON, nullable=False)
    otp = Column(String(6), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(String(36), ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(150), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(String(255), nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, SUCCESS, FAILED
    transaction_ref = Column(String(150), nullable=True)
    gateway = Column(String(50), nullable=False)  # RAZORPAY, STRIPE, COD
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    delivery_partner_id = Column(String(36), ForeignKey("delivery_partners.user_id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(20), default="ASSIGNED", nullable=False)  # ASSIGNED, PICKED_UP, DELIVERED, FAILED
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    picked_up_at = Column(DateTime, nullable=True)
    out_for_delivery_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    otp_verified = Column(Boolean, default=False, nullable=False)
    otp_hash = Column(String(128), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.user_id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    rating_shop = Column(Integer, nullable=True)
    rating_delivery = Column(Integer, nullable=True)
    review_text_shop = Column(Text, nullable=True)
    review_text_delivery = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    type = Column(String(30), default="SYSTEM", nullable=False)  # ORDER_STATUS, PROMOTION, SYSTEM
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(30), nullable=False)  # Role of the filer
    issue_category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, RESOLVED, REJECTED
    resolution_notes = Column(Text, nullable=True)


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    shop_id = Column(String(36), ForeignKey("shops.id", ondelete="RESTRICT"), nullable=False)
    order_total = Column(Numeric(10, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    amount_earned = Column(Numeric(10, 2), nullable=False)


class Earning(Base):
    __tablename__ = "earnings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(30), nullable=False)  # SHOP_SALE, DELIVERY_PAY, COMMISSION
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="UNPAID", nullable=False)  # UNPAID, PAID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    admin = relationship("User")

