import random
import string
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Shop, FoodItem, Order, OrderItem, Commission, Earning, Shopkeeper
from app.schemas.shop import ShopResponse, FoodItemResponse
from app.schemas.order import OrderCreate, OrderResponse

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
    # Verify shop exists
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found."
        )
    return db.query(FoodItem).filter(FoodItem.shop_id == shop_id).all()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new student food delivery order, calculating bill splits, commission logs, and OTP codes."""
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

    # Validate items and calculate subtotal
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
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = "".join(random.choices(string.digits, k=4))
    order_number = f"CB-{date_str}-{random_suffix}"

    # Generate random 4-digit Delivery verification code
    otp = "".join(random.choices(string.digits, k=4))

    # Create Order object
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
        payment_status="PAID" if order_in.payment_method == "ONLINE" else "PENDING",
        payment_method=order_in.payment_method,
        delivery_address=order_in.delivery_address.dict(),
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

    # Commission Logging (10% flat platform commission)
    commission_rate = Decimal("10.00")
    commission_earned = calculated_subtotal * (commission_rate / Decimal("100.00"))

    db_commission = Commission(
        order_id=db_order.id,
        shop_id=shop.id,
        order_total=calculated_subtotal,
        percentage=commission_rate,
        amount_earned=commission_earned
    )
    db.add(db_commission)

    # Shopkeeper Earning calculation
    shop_payout = calculated_subtotal - commission_earned
    db_earning = Earning(
        user_id=shop.shopkeeper_id,
        amount=shop_payout,
        type="SHOP_SALE",
        order_id=db_order.id,
        status="UNPAID"
    )
    db.add(db_earning)

    db.commit()
    db.refresh(db_order)

    # Set virtual field for Pydantic serialization
    db_order.shop_name = shop.name
    return db_order


@router.get("/orders", response_model=List[OrderResponse])
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


@router.get("/orders/{order_id}", response_model=OrderResponse)
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
