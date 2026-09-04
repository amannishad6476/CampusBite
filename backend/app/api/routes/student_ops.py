import random
import string
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
import logging
from sqlalchemy import func
from app.models.models import User, Shop, FoodItem, Order, OrderItem, Review, Notification
from app.schemas.shop import ShopResponse, FoodItemResponse
from app.schemas.order import OrderCreate, StudentOrderResponse, PaymentSessionResponse, PaymentVerificationResponse
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services.payment_service import CashfreeService
from app.services.notification_service import NotificationService

logger = logging.getLogger("campusbite.student_ops")


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

    # Dispatch in-app order placed notification
    try:
        NotificationService.create_order_notification(db, db_order, "PLACED")
        NotificationService.create_shopkeeper_order_notification(db, db_order, shop)
    except Exception as notif_err:
        logger.warning(f"Could not dispatch order placed notification: {notif_err}")

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


# ==============================================================================
# REVIEWS ENDPOINTS
# ==============================================================================

@router.post("/orders/{order_id}/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_order_review(
    order_id: str,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a star rating and feedback for a completed/delivered order.
    Enforces student ownership, DELIVERED state, and single review per order.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # 1. Ownership check: Must be student's own order
    if order.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only review your own orders."
        )

    # 2. Workflow state check: Must be DELIVERED
    if order.status.upper() != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review rejected: Only delivered orders can be reviewed."
        )

    # 3. Duplicate check: 1 review per order
    existing_review = db.query(Review).filter(Review.order_id == order_id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate review rejected: This order has already been reviewed."
        )

    # 4. Save review securely deriving student_id and shop_id
    db_review = Review(
        order_id=order.id,
        student_id=current_user.id,
        shop_id=order.shop_id,
        rating_shop=review_in.rating_shop,
        rating_delivery=review_in.rating_delivery,
        review_text_shop=review_in.review_text_shop.strip() if review_in.review_text_shop else None,
        review_text_delivery=review_in.review_text_delivery.strip() if review_in.review_text_delivery else None
    )
    db.add(db_review)
    db.flush()

    # 5. Dynamically update shop average rating
    try:
        avg_rating = db.query(func.avg(Review.rating_shop)).filter(Review.shop_id == order.shop_id).scalar()
        if avg_rating is not None:
            shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
            if shop:
                shop.rating = Decimal(str(round(avg_rating, 2)))
    except Exception as exc:
        logger.warning(f"Could not update shop average rating: {exc}")

    db.commit()
    db.refresh(db_review)
    return db_review


@router.get("/orders/{order_id}/review", response_model=Optional[ReviewResponse])
def get_order_review(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve existing review for a specific order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.student_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only view reviews for your own orders."
        )

    review = db.query(Review).filter(Review.order_id == order_id).first()
    return review


@router.get("/reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all reviews submitted by the current authenticated student."""
    return db.query(Review).filter(
        Review.student_id == current_user.id
    ).order_by(Review.created_at.desc()).all()


# ==============================================================================
# NOTIFICATIONS ENDPOINTS
# ==============================================================================

@router.get("/notifications", response_model=List[NotificationResponse])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all in-app notifications for the authenticated student."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def get_unread_notifications_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve count of unread notifications for badge counters."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    if notif.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/notifications/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications for the current student as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("/notifications")
def clear_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all notifications for the current student."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All notifications cleared."}


@router.delete("/notifications/{notification_id}")
def delete_single_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a single notification."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    if notif.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted."}

