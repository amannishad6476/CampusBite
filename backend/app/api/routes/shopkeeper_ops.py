from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import logging

from app.core.database import get_db
from app.api.deps import RoleChecker
from app.models.models import (
    User, Shop, FoodCategory, FoodItem, Order, OrderItem,
    Commission, Earning, Shopkeeper, Campus, Notification
)
from app.schemas.shop import ShopResponse, FoodCategoryResponse, FoodItemResponse
from app.schemas.order import OrderResponse
from app.schemas.shopkeeper import (
    ShopUpdate, FoodCategoryCreate, FoodCategoryUpdate,
    FoodItemCreate, FoodItemUpdate, FoodItemAvailabilityToggle,
    OrderPatchStatus, EarningSummaryResponse, ShopkeeperProfileResponse
)
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services.notification_service import NotificationService

logger = logging.getLogger("campusbite.shopkeeper")
router = APIRouter()
require_shopkeeper = RoleChecker(["SHOPKEEPER"])


def get_shopkeeper_shop(current_user: User, db: Session) -> Shop:
    """Retrieve the shop belonging to the authenticated shopkeeper. Raises 404 if not found."""
    shop = db.query(Shop).filter(Shop.shopkeeper_id == current_user.id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop profile not found. Please contact administration to register a canteen."
        )
    return shop


def populate_shop_metadata(shop: Shop, db: Session) -> Shop:
    if shop.campus_id:
        campus = db.query(Campus).filter(Campus.id == shop.campus_id).first()
        if campus:
            shop.campus_name = campus.name
    return shop


def populate_item_metadata(item: FoodItem, db: Session) -> FoodItem:
    if item.category_id:
        cat = db.query(FoodCategory).filter(FoodCategory.id == item.category_id).first()
        if cat:
            item.category_name = cat.name
    return item


def populate_order_metadata(order: Order, shop_name: str, db: Session) -> Order:
    order.shop_name = shop_name
    if order.student_id:
        student = db.query(User).filter(User.id == order.student_id).first()
        if student:
            order.student_name = student.name
    return order


# ==============================================================================
# 1. Shop Setup & Profile Endpoints
# ==============================================================================

@router.get("/me/shop", response_model=ShopResponse)
@router.get("/shop", response_model=ShopResponse, include_in_schema=False)
def get_my_shop(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve the shopkeeper's canteen profile."""
    shop = get_shopkeeper_shop(current_user, db)
    return populate_shop_metadata(shop, db)


@router.put("/me/shop", response_model=ShopResponse)
@router.put("/shop", response_model=ShopResponse, include_in_schema=False)
def update_my_shop(
    shop_in: ShopUpdate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Update shopkeeper's canteen configuration metadata."""
    shop = get_shopkeeper_shop(current_user, db)
    
    update_data = shop_in.model_dump(exclude_unset=True) if hasattr(shop_in, "model_dump") else shop_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shop, field, value)
        
    db.commit()
    db.refresh(shop)
    return populate_shop_metadata(shop, db)


@router.get("/me", response_model=ShopkeeperProfileResponse)
@router.get("/profile", response_model=ShopkeeperProfileResponse, include_in_schema=False)
def get_my_profile(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve profile and assigned canteen info for current shopkeeper."""
    shop = db.query(Shop).filter(Shop.shopkeeper_id == current_user.id).first()
    campus_name = None
    if shop and shop.campus_id:
        campus = db.query(Campus).filter(Campus.id == shop.campus_id).first()
        if campus:
            campus_name = campus.name
    return ShopkeeperProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        shop_id=shop.id if shop else None,
        shop_name=shop.name if shop else None,
        campus_id=shop.campus_id if shop else None,
        campus_name=campus_name
    )


# ==============================================================================
# 2. Category CRUD Endpoints
# ==============================================================================

@router.get("/me/categories", response_model=List[FoodCategoryResponse])
@router.get("/categories", response_model=List[FoodCategoryResponse], include_in_schema=False)
def get_my_categories(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Fetch food categories registered under the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    return db.query(FoodCategory).filter(FoodCategory.shop_id == shop.id).all()


@router.post("/me/categories", response_model=FoodCategoryResponse, status_code=status.HTTP_201_CREATED)
@router.post("/categories", response_model=FoodCategoryResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_category(
    cat_in: FoodCategoryCreate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Add a new food category under the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    db_cat = FoodCategory(name=cat_in.name, shop_id=shop.id)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


@router.put("/me/categories/{id}", response_model=FoodCategoryResponse)
@router.put("/categories/{id}", response_model=FoodCategoryResponse, include_in_schema=False)
def update_category(
    id: int,
    cat_in: FoodCategoryUpdate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Edit the name of an existing food category (ownership checked)."""
    shop = get_shopkeeper_shop(current_user, db)
    db_cat = db.query(FoodCategory).filter(FoodCategory.id == id, FoodCategory.shop_id == shop.id).first()
    if not db_cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or access denied."
        )
    db_cat.name = cat_in.name
    db.commit()
    db.refresh(db_cat)
    return db_cat


@router.delete("/me/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/categories/{id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
def delete_category(
    id: int,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Delete a category (ownership checked)."""
    shop = get_shopkeeper_shop(current_user, db)
    db_cat = db.query(FoodCategory).filter(FoodCategory.id == id, FoodCategory.shop_id == shop.id).first()
    if not db_cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or access denied."
        )
    db.delete(db_cat)
    db.commit()


# ==============================================================================
# 3. Menu Items CRUD Endpoints
# ==============================================================================

@router.get("/me/menu", response_model=List[FoodItemResponse])
@router.get("/menu", response_model=List[FoodItemResponse], include_in_schema=False)
def get_my_menu(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Fetch food menu items belonging to the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    items = db.query(FoodItem).filter(FoodItem.shop_id == shop.id).order_by(FoodItem.created_at.desc()).all()
    categories = {c.id: c.name for c in db.query(FoodCategory).filter(FoodCategory.shop_id == shop.id).all()}
    for it in items:
        it.category_name = categories.get(it.category_id, "General")
    return items


@router.post("/me/menu", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
@router.post("/menu", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_menu_item(
    item_in: FoodItemCreate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Create a new food item. Checks that the target category belongs to the shopkeeper or auto-creates General."""
    shop = get_shopkeeper_shop(current_user, db)
    
    category_id = item_in.category_id
    if category_id is None:
        default_cat = db.query(FoodCategory).filter(
            FoodCategory.shop_id == shop.id,
            FoodCategory.name == "General"
        ).first()
        if not default_cat:
            default_cat = FoodCategory(name="General", shop_id=shop.id)
            db.add(default_cat)
            db.commit()
            db.refresh(default_cat)
        category_id = default_cat.id
    else:
        category = db.query(FoodCategory).filter(
            FoodCategory.id == category_id,
            FoodCategory.shop_id == shop.id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id. The target category must belong to your canteen."
            )

    db_item = FoodItem(
        name=item_in.name,
        price=item_in.price,
        description=item_in.description,
        image_url=item_in.image_url,
        is_veg=item_in.is_veg,
        is_available=item_in.is_available,
        category_id=category_id,
        preparation_time=item_in.preparation_time,
        shop_id=shop.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return populate_item_metadata(db_item, db)


@router.put("/me/menu/{id}", response_model=FoodItemResponse)
@router.put("/menu/{id}", response_model=FoodItemResponse, include_in_schema=False)
def update_menu_item(
    id: str,
    item_in: FoodItemUpdate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Update an existing food item (ownership checked)."""
    shop = get_shopkeeper_shop(current_user, db)
    db_item = db.query(FoodItem).filter(FoodItem.id == id, FoodItem.shop_id == shop.id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found or access denied."
        )

    update_data = item_in.dict(exclude_unset=True) if hasattr(item_in, "dict") else item_in.model_dump(exclude_unset=True)
    if "category_id" in update_data and update_data["category_id"] is not None:
        cat = db.query(FoodCategory).filter(
            FoodCategory.id == update_data["category_id"],
            FoodCategory.shop_id == shop.id
        ).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id. The target category must belong to your canteen."
            )

    for field, value in update_data.items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return populate_item_metadata(db_item, db)


@router.patch("/me/menu/{id}/availability", response_model=FoodItemResponse)
@router.patch("/menu/{id}/availability", response_model=FoodItemResponse, include_in_schema=False)
def toggle_item_availability(
    id: str,
    toggle_in: FoodItemAvailabilityToggle,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Quick 1-click toggle for food item availability."""
    shop = get_shopkeeper_shop(current_user, db)
    db_item = db.query(FoodItem).filter(FoodItem.id == id, FoodItem.shop_id == shop.id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found or access denied."
        )

    db_item.is_available = toggle_in.is_available
    db.commit()
    db.refresh(db_item)
    return populate_item_metadata(db_item, db)


@router.delete("/me/menu/{id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/menu/{id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
def delete_menu_item(
    id: str,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Delete a food item (ownership checked)."""
    shop = get_shopkeeper_shop(current_user, db)
    db_item = db.query(FoodItem).filter(FoodItem.id == id, FoodItem.shop_id == shop.id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found or access denied."
        )
    db.delete(db_item)
    db.commit()


# ==============================================================================
# 4. Orders Management Endpoints
# ==============================================================================

@router.get("/me/orders", response_model=List[OrderResponse])
@router.get("/orders", response_model=List[OrderResponse], include_in_schema=False)
def get_my_orders(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """List orders placed at the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    query = db.query(Order).filter(Order.shop_id == shop.id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter.upper())
        
    orders = query.order_by(Order.created_at.desc()).all()
    student_ids = {o.student_id for o in orders if o.student_id}
    students = {}
    if student_ids:
        students = {u.id: u.name for u in db.query(User).filter(User.id.in_(student_ids)).all()}
        
    for order in orders:
        order.shop_name = shop.name
        order.student_name = students.get(order.student_id)
        
    return orders


@router.get("/me/orders/{id}", response_model=OrderResponse)
@router.get("/orders/{id}", response_model=OrderResponse, include_in_schema=False)
def get_order_details(
    id: str,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific order (ownership checked)."""
    shop = get_shopkeeper_shop(current_user, db)
    order = db.query(Order).filter(Order.id == id, Order.shop_id == shop.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or access denied."
        )
    return populate_order_metadata(order, shop.name, db)


@router.patch("/me/orders/{id}/status", response_model=OrderResponse)
@router.patch("/orders/{id}/status", response_model=OrderResponse, include_in_schema=False)
def update_order_status(
    id: str,
    status_in: OrderPatchStatus,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Transition an order's status. Blocks direct delivery updates."""
    shop = get_shopkeeper_shop(current_user, db)
    order = db.query(Order).filter(Order.id == id, Order.shop_id == shop.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or access denied."
        )

    current_status = order.status.upper()
    target_status = status_in.status.upper()

    # Shopkeeper order transition rules
    allowed_transitions = {
        "PENDING": ["ACCEPTED", "CANCELLED"],
        "ACCEPTED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY_FOR_PICKUP", "CANCELLED"]
    }

    if current_status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status update blocked: Shopkeepers cannot transition orders from state '{current_status}'."
        )

    if target_status not in allowed_transitions[current_status]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow status transition from '{current_status}' to '{target_status}'."
        )

    order.status = target_status
    db.commit()
    db.refresh(order)

    try:
        NotificationService.create_order_notification(db, order, target_status)
    except Exception as notif_err:
        logger.warning(f"Could not dispatch status notification for {target_status}: {notif_err}")

    return populate_order_metadata(order, shop.name, db)


# ==============================================================================
# 5. Earnings Endpoint
# ==============================================================================

@router.get("/me/earnings", response_model=EarningSummaryResponse)
@router.get("/earnings", response_model=EarningSummaryResponse, include_in_schema=False)
def get_my_earnings(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve daily, weekly, monthly, and overall earnings statistics."""
    shop = get_shopkeeper_shop(current_user, db)
    
    # Calculate start points for time windows
    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day)
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)

    # 1. Net Earnings (sum of earnings where user_id matches and type is SHOP_SALE)
    today_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "SHOP_SALE",
        Earning.created_at >= start_of_today
    ).scalar() or Decimal("0.00")

    weekly_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "SHOP_SALE",
        Earning.created_at >= one_week_ago
    ).scalar() or Decimal("0.00")

    monthly_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "SHOP_SALE",
        Earning.created_at >= one_month_ago
    ).scalar() or Decimal("0.00")

    net_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "SHOP_SALE"
    ).scalar() or Decimal("0.00")

    # 2. Total Completed Orders
    total_orders = db.query(func.count(Order.id)).filter(
        Order.shop_id == shop.id,
        Order.status == "DELIVERED"
    ).scalar() or 0

    # 3. Deducted Commission (aggregated from the Commissions table)
    commission_deducted = db.query(func.sum(Commission.amount_earned)).filter(
        Commission.shop_id == shop.id
    ).scalar() or Decimal("0.00")

    return EarningSummaryResponse(
        today_earnings=today_earnings,
        weekly_earnings=weekly_earnings,
        monthly_earnings=monthly_earnings,
        total_orders=total_orders,
        commission_deducted=commission_deducted,
        net_earnings=net_earnings
    )


# ==============================================================================
# 6. Notifications Endpoints
# ==============================================================================

@router.get("/me/notifications", response_model=List[NotificationResponse])
@router.get("/notifications", response_model=List[NotificationResponse], include_in_schema=False)
def get_shopkeeper_notifications(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve in-app notifications for the authenticated shopkeeper."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@router.get("/me/notifications/unread-count", response_model=UnreadCountResponse)
@router.get("/notifications/unread-count", response_model=UnreadCountResponse, include_in_schema=False)
def get_shopkeeper_unread_notifications_count(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve count of unread notifications for badge counters."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/me/notifications/{notification_id}/read", response_model=NotificationResponse)
@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse, include_in_schema=False)
def mark_shopkeeper_notification_read(
    notification_id: str,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Mark a single shopkeeper notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    if notif.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/me/notifications/read-all")
@router.post("/notifications/read-all", include_in_schema=False)
def mark_all_shopkeeper_notifications_read(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications for current shopkeeper as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read."}

