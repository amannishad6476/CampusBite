from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import logging

from app.core.database import get_db
from app.api.deps import RoleChecker
from app.models.models import User, Shop, FoodCategory, FoodItem, Order, OrderItem, Commission, Earning, Shopkeeper
from app.schemas.shop import ShopResponse, FoodCategoryResponse, FoodItemResponse
from app.schemas.order import OrderResponse
from app.schemas.shopkeeper import ShopUpdate, FoodCategoryCreate, FoodCategoryUpdate, FoodItemCreate, FoodItemUpdate, OrderPatchStatus, EarningSummaryResponse
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

# 1. Shop Setup / Profile Endpoints
@router.get("/me/shop", response_model=ShopResponse)
def get_my_shop(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Retrieve the shopkeeper's canteen profile."""
    return get_shopkeeper_shop(current_user, db)

@router.put("/me/shop", response_model=ShopResponse)
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
    return shop


# 2. Category CRUD Endpoints
@router.get("/me/categories", response_model=List[FoodCategoryResponse])
def get_my_categories(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Fetch food categories registered under the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    return db.query(FoodCategory).filter(FoodCategory.shop_id == shop.id).all()

@router.post("/me/categories", response_model=FoodCategoryResponse, status_code=status.HTTP_201_CREATED)
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


# 3. Menu Items CRUD Endpoints
@router.get("/me/menu", response_model=List[FoodItemResponse])
def get_my_menu(
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Fetch food menu items belonging to the shopkeeper's canteen."""
    shop = get_shopkeeper_shop(current_user, db)
    return db.query(FoodItem).filter(FoodItem.shop_id == shop.id).all()

@router.post("/me/menu", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item_in: FoodItemCreate,
    current_user: User = Depends(require_shopkeeper),
    db: Session = Depends(get_db)
):
    """Create a new food item. Checks that the target category belongs to the shopkeeper."""
    shop = get_shopkeeper_shop(current_user, db)
    
    # Check category ownership
    category = db.query(FoodCategory).filter(
        FoodCategory.id == item_in.category_id,
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
        category_id=item_in.category_id,
        preparation_time=item_in.preparation_time,
        shop_id=shop.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/me/menu/{id}", response_model=FoodItemResponse)
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

    update_data = item_in.dict(exclude_unset=True)
    if "category_id" in update_data:
        # Check category ownership
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
    return db_item

@router.delete("/me/menu/{id}", status_code=status.HTTP_204_NO_CONTENT)
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


# 4. Orders Management Endpoints
@router.get("/me/orders", response_model=List[OrderResponse])
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
    for order in orders:
        order.shop_name = shop.name
        
    return orders

@router.get("/me/orders/{id}", response_model=OrderResponse)
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
    order.shop_name = shop.name
    return order

@router.patch("/me/orders/{id}/status", response_model=OrderResponse)
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

    order.shop_name = shop.name
    return order


# 5. Earnings Endpoint
@router.get("/me/earnings", response_model=EarningSummaryResponse)
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
