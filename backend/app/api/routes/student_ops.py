import random
import string
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Shop, FoodItem, Order, OrderItem
from app.schemas.shop import ShopResponse, FoodItemResponse
from app.schemas.order import OrderCreate, StudentOrderResponse, PaymentSessionResponse, PaymentVerificationResponse
from app.services.payment_service import CashfreeService


router = APIRouter()

@router.get("/shops", response_model=List[ShopResponse])
def get_shops(
    campus_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve shops operating on a specific campus. Defaults to the student's registered campus."""
    if campus_id is None:
        if current_user.student:
            campus_id = current_user.student.campus_id
        else:
            campus_id = 1  # Default fallback
            
    return db.query(Shop).filter(Shop.campus_id == campus_id).all()


@router.get("/shops/{shop_id}/menu", response_model=List[FoodItemResponse])
def get_shop_menu(
    shop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve food menu catalog items for a canteen."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found."
        )
    return db.query(FoodItem).filter(FoodItem.shop_id == shop_id).all()


@router.post("/orders", response_model=StudentOrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new student food delivery order, calculating bill splits and OTP codes server-side."""
    if current_user.role != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only STUDENT accounts are authorized to place orders."
        )

    # Validate shop
    shop = db.query(Shop).filter(Shop.id == order_in.shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canteen not found."
        )

    calculated_subtotal = Decimal("0.00")
    order_items_cache = []

    # Validate items and calculate subtotal securely server-side
    for item_in in order_in.items:
        food_item = db.query(FoodItem).filter(
            FoodItem.id == item_in.food_item_id,
            FoodItem.shop_id == shop.id
        ).first()

        if not food_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item {item_in.food_item_id} not found in this canteen."
            )
        
        if not food_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item {food_item.name} is currently out of stock."
            )

        item_subtotal = Decimal(str(food_item.price)) * Decimal(item_in.quantity)
        calculated_subtotal += item_subtotal

        order_items_cache.append({
            "food_item_id": food_item.id,
            "name": food_item.name,
            "price": food_item.price,
            "quantity": item_in.quantity,
            "notes": item_in.notes
        })

    # Billing Constants
    delivery_fee = Decimal("15.00")
    tax = Decimal("2.50")
    total_amount = calculated_subtotal + delivery_fee + tax

    # Generate Order ID CB-YYYYMMDD-XXXX
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = "".join(random.choices(string.digits, k=4))
    order_number = f"CB-{date_str}-{random_suffix}"

    # Generate random 4-digit Delivery verification code
    otp = "".join(random.choices(string.digits, k=4))

    # Create Order object
    delivery_addr_data = getattr(order_in.delivery_address, "model_dump", None)
    if callable(delivery_addr_data):
        delivery_addr_dict = order_in.delivery_address.model_dump()
    else:
        delivery_addr_dict = order_in.delivery_address.dict()

    db_order = Order(
        order_number=order_number,
        student_id=current_user.id,
        shop_id=shop.id,
        status="PENDING",
        subtotal=calculated_subtotal,
        delivery_fee=delivery_fee,
        discount=Decimal("0.00"),
        tax=tax,
        total_amount=total_amount,
        payment_status="PENDING",
        payment_method=order_in.payment_method,
        delivery_address=delivery_addr_dict,
        otp=otp
    )
    db.add(db_order)
    db.flush()  # Populates db_order.id UUID

    # Create OrderItems
    for cache_item in order_items_cache:
        db_item = OrderItem(
            order_id=db_order.id,
            food_item_id=cache_item["food_item_id"],
            name=cache_item["name"],
            price=cache_item["price"],
            quantity=cache_item["quantity"],
            notes=cache_item["notes"]
        )
        db.add(db_item)

    # Finalize placement transaction (earnings & commissions are finalized upon successful OTP delivery)
    db.commit()
    db.refresh(db_order)

    # Set virtual field for Pydantic serialization
    db_order.shop_name = shop.name
    return db_order


@router.get("/orders", response_model=List[StudentOrderResponse])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical orders placed by the current student."""
    orders = db.query(Order).filter(Order.student_id == current_user.id).order_by(Order.created_at.desc()).all()
    
    # Pre-populate canteen name context for each order response
    for order in orders:
        shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
        order.shop_name = shop.name if shop else "Campus Canteen"
        
    return orders


@router.get("/orders/{order_id}", response_model=StudentOrderResponse)
def get_order_details(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve tracking details for a single specific order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )
    
    # Security: Verify ownership
    if order.student_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view this order details."
        )

    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    order.shop_name = shop.name if shop else "Campus Canteen"
    return order


@router.post("/orders/{order_id}/create-payment", response_model=PaymentSessionResponse)
def create_order_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initializes a secure server-side Cashfree payment session for an order.
    Returns safe payment session details for the mobile SDK/checkout.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    if order.student_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to pay for this order."
        )

    return CashfreeService.create_payment_session(db, order, current_user)


@router.post("/orders/{order_id}/verify-payment", response_model=PaymentVerificationResponse)
def verify_order_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authoritative server-side verification of order payment status via Cashfree.
    Synchronizes payment status with the order record.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    if order.student_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to verify this order."
        )

    return CashfreeService.verify_order_payment(db, order)

