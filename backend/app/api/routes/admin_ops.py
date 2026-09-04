from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.database import get_db
from app.api.deps import RoleChecker
from app.core.security import get_password_hash
from app.models.models import (
    User, Student, Shopkeeper, DeliveryPartner, Shop, Order,
    Commission, Earning, Campus, College, Block, Hostel, AuditLog, FoodItem,
    Payment, Delivery, FoodCategory
)
from app.schemas.admin import (
    DashboardSummary, StatusUpdatePayload, UserStatusUpdatePayload,
    OrderOverridePayload, AuditLogResponse, CampusCreate, CollegeCreate,
    BlockCreate, HostelCreate, ShopkeeperCreate, DeliveryPartnerCreate,
    ShopCreate, ShopUpdateAdmin, FoodItemCreateAdmin, FoodItemUpdateAdmin,
    OrderAssignRiderPayload, PaymentResponse
)
from app.schemas.location import CampusResponse, CollegeResponse, BlockResponse, HostelResponse
from app.schemas.shop import ShopResponse, FoodItemResponse
from app.schemas.order import OrderResponse
from app.services.notification_service import NotificationService

router = APIRouter()
require_admin = RoleChecker(["ADMIN"])

def log_admin_action(db: Session, admin_id: str, action: str, target_type: str, target_id: str, reason: Optional[str] = None):
    """Helper to write an immutable audit log entry."""
    log = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()


# 1. Dashboard Metrics
@router.get("/dashboard", response_model=DashboardSummary)
def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Compile counts, stats and financial data for admin overview."""
    total_students = db.query(Student).count()
    total_shopkeepers = db.query(Shopkeeper).count()
    total_delivery_partners = db.query(DeliveryPartner).count()
    total_shops = db.query(Shop).count()
    active_shops = db.query(Shop).filter(Shop.status == "ACTIVE").count()

    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day)

    today_orders = db.query(Order).filter(Order.created_at >= start_of_today).count()
    completed_orders = db.query(Order).filter(Order.status == "DELIVERED").count()
    cancelled_orders = db.query(Order).filter(Order.status == "CANCELLED").count()

    today_gmv = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= start_of_today,
        Order.status != "CANCELLED"
    ).scalar() or Decimal("0.00")

    platform_commission = db.query(func.sum(Commission.amount_earned)).scalar() or Decimal("0.00")
    delivery_fees = db.query(func.sum(Order.delivery_fee)).filter(Order.status == "DELIVERED").scalar() or Decimal("0.00")

    return DashboardSummary(
        total_students=total_students,
        total_shopkeepers=total_shopkeepers,
        total_delivery_partners=total_delivery_partners,
        total_shops=total_shops,
        active_shops=active_shops,
        today_orders=today_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        today_gmv=today_gmv,
        platform_commission=platform_commission,
        delivery_fees=delivery_fees,
        net_platform_earnings=platform_commission
    )


# 2. Location Management (Campuses)
@router.post("/campuses", response_model=CampusResponse, status_code=status.HTTP_201_CREATED)
def create_campus(
    payload: CampusCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Register a new campus."""
    campus = Campus(
        name=payload.name,
        address=payload.address,
        city_id=payload.city_id,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    
    log_admin_action(db, current_user.id, "CREATE_CAMPUS", "CAMPUS", str(campus.id), f"Created campus '{campus.name}'")
    return campus

@router.put("/campuses/{campus_id}", response_model=CampusResponse)
def update_campus(
    campus_id: int,
    payload: CampusCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Modify details of a campus."""
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")
        
    campus.name = payload.name
    campus.address = payload.address
    campus.city_id = payload.city_id
    campus.latitude = payload.latitude
    campus.longitude = payload.longitude
    db.commit()
    db.refresh(campus)
    
    log_admin_action(db, current_user.id, "UPDATE_CAMPUS", "CAMPUS", str(campus.id), f"Updated campus details for '{campus.name}'")
    return campus

@router.delete("/campuses/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus(
    campus_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deletes a campus if no dependent records exist."""
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found.")
        
    # Dependents checks
    if db.query(College).filter(College.campus_id == campus_id).first() or \
       db.query(Shop).filter(Shop.campus_id == campus_id).first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete campus: Dependent colleges or shops exist. Remove them first."
        )
        
    campus_name = campus.name
    db.delete(campus)
    db.commit()
    
    log_admin_action(db, current_user.id, "DELETE_CAMPUS", "CAMPUS", str(campus_id), f"Deleted campus '{campus_name}'")


# 3. Location Management (Colleges)
@router.post("/colleges", response_model=CollegeResponse, status_code=status.HTTP_201_CREATED)
def create_college(
    payload: CollegeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Register a college."""
    college = College(name=payload.name, campus_id=payload.campus_id)
    db.add(college)
    db.commit()
    db.refresh(college)
    log_admin_action(db, current_user.id, "CREATE_COLLEGE", "COLLEGE", str(college.id), f"Created college '{college.name}'")
    return college

@router.put("/colleges/{college_id}", response_model=CollegeResponse)
def update_college(
    college_id: int,
    payload: CollegeCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found.")
    college.name = payload.name
    college.campus_id = payload.campus_id
    db.commit()
    db.refresh(college)
    log_admin_action(db, current_user.id, "UPDATE_COLLEGE", "COLLEGE", str(college.id), f"Updated college '{college.name}'")
    return college

@router.delete("/colleges/{college_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_college(
    college_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found.")
    db.delete(college)
    db.commit()
    log_admin_action(db, current_user.id, "DELETE_COLLEGE", "COLLEGE", str(college_id), f"Deleted college '{college.name}'")


# 4. Location Management (Blocks)
@router.post("/blocks", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
def create_block(
    payload: BlockCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    block = Block(name=payload.name, campus_id=payload.campus_id)
    db.add(block)
    db.commit()
    db.refresh(block)
    log_admin_action(db, current_user.id, "CREATE_BLOCK", "BLOCK", str(block.id), f"Created block '{block.name}'")
    return block

@router.put("/blocks/{block_id}", response_model=BlockResponse)
def update_block(
    block_id: int,
    payload: BlockCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found.")
    block.name = payload.name
    block.campus_id = payload.campus_id
    db.commit()
    db.refresh(block)
    log_admin_action(db, current_user.id, "UPDATE_BLOCK", "BLOCK", str(block.id), f"Updated block '{block.name}'")
    return block

@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(
    block_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found.")
    db.delete(block)
    db.commit()
    log_admin_action(db, current_user.id, "DELETE_BLOCK", "BLOCK", str(block_id), f"Deleted block '{block.name}'")


# 5. Location Management (Hostels)
@router.post("/hostels", response_model=HostelResponse, status_code=status.HTTP_201_CREATED)
def create_hostel(
    payload: HostelCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    hostel = Hostel(name=payload.name, campus_id=payload.campus_id)
    db.add(hostel)
    db.commit()
    db.refresh(hostel)
    log_admin_action(db, current_user.id, "CREATE_HOSTEL", "HOSTEL", str(hostel.id), f"Created hostel '{hostel.name}'")
    return hostel

@router.put("/hostels/{hostel_id}", response_model=HostelResponse)
def update_hostel(
    hostel_id: int,
    payload: HostelCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    hostel.name = payload.name
    hostel.campus_id = payload.campus_id
    db.commit()
    db.refresh(hostel)
    log_admin_action(db, current_user.id, "UPDATE_HOSTEL", "HOSTEL", str(hostel.id), f"Updated hostel '{hostel.name}'")
    return hostel

@router.delete("/hostels/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hostel(
    hostel_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    hostel = db.query(Hostel).filter(Hostel.id == hostel_id).first()
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found.")
    db.delete(hostel)
    db.commit()
    log_admin_action(db, current_user.id, "DELETE_HOSTEL", "HOSTEL", str(hostel_id), f"Deleted hostel '{hostel.name}'")


# 6. Shops Operations
@router.get("/shops", response_model=List[ShopResponse])
def list_all_shops(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all canteens registered on the platform."""
    return db.query(Shop).all()

@router.get("/shops/{shop_id}", response_model=ShopResponse)
def get_shop_details(
    shop_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")
    return shop

@router.patch("/shops/{shop_id}/status", response_model=ShopResponse)
def change_shop_status(
    shop_id: str,
    payload: StatusUpdatePayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Modify shop approval flow states (PENDING, APPROVED, ACTIVE, SUSPENDED, INACTIVE)."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")
        
    old_status = shop.status
    shop.status = payload.status
    db.commit()
    db.refresh(shop)
    
    reason_str = payload.reason or "No details provided."
    log_admin_action(
        db, current_user.id, "UPDATE_SHOP_STATUS", "SHOP", shop_id,
        f"Transitioned status of shop '{shop.name}' from '{old_status}' to '{payload.status}'. Reason: {reason_str}"
    )
    return shop

@router.get("/shops/{shop_id}/menu", response_model=List[FoodItemResponse])
def get_shop_menu(
    shop_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(FoodItem).filter(FoodItem.shop_id == shop_id).all()

@router.get("/shops/{shop_id}/orders", response_model=List[OrderResponse])
def get_shop_orders(
    shop_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Order).filter(Order.shop_id == shop_id).all()


# 7. User Accounts Operations
@router.get("/students")
def get_students(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve lists of students, joined with base user attributes."""
    results = db.query(User, Student).join(Student, User.id == Student.user_id).all()
    out = []
    for u, s in results:
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "campus_id": s.campus_id,
            "college_id": s.college_id,
            "created_at": u.created_at
        })
    return out

@router.get("/shopkeepers")
def get_shopkeepers(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    results = db.query(User, Shopkeeper).join(Shopkeeper, User.id == Shopkeeper.user_id).all()
    out = []
    for u, s in results:
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return out

@router.get("/delivery-partners")
def get_delivery_partners(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    results = db.query(User, DeliveryPartner).join(DeliveryPartner, User.id == DeliveryPartner.user_id).all()
    out = []
    for u, d in results:
        # Check active status dynamically
        active_delivery = db.query(Order).filter(
            Order.delivery_partner_id == u.id,
            Order.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
        ).first()
        status_str = "OFFLINE"
        if d.is_active:
            status_str = "BUSY" if active_delivery else "ONLINE"

        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "vehicle_type": d.vehicle_type,
            "vehicle_number": d.vehicle_number,
            "rating": d.rating,
            "status": status_str,
            "created_at": u.created_at
        })
    return out

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdatePayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Enables or suspends a user login credentials."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    old_active = target_user.is_active
    target_user.is_active = payload.is_active
    db.commit()
    db.refresh(target_user)
    
    action_str = "ACTIVATE" if payload.is_active else "SUSPEND"
    reason_str = payload.reason or "No details provided."
    log_admin_action(
        db, current_user.id, f"{action_str}_USER", "USER", user_id,
        f"Modified account is_active state of user '{target_user.email}' from '{old_active}' to '{payload.is_active}'. Reason: {reason_str}"
    )
    return {"message": "User status adjusted.", "is_active": target_user.is_active}


# 8. Orders Audits & Override
@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Browse orders across all canteens."""
    return db.query(Order).all()

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order

@router.post("/orders/{order_id}/override", response_model=OrderResponse)
def override_order_status(
    order_id: str,
    payload: OrderOverridePayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Force order status adjustments in emergency cases with mandatory reason logs."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    old_status = order.status
    order.status = payload.status
    db.commit()
    db.refresh(order)
    
    try:
        NotificationService.create_order_notification(db, order, payload.status)
    except Exception:
        pass

    log_admin_action(
        db, current_user.id, "OVERRIDE_ORDER", "ORDER", order_id,
        f"Admin forced order status from '{old_status}' to '{payload.status}'. Reason: {payload.reason}"
    )
    return order


# 9. Audit Logs Feed
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Read full system audit history."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    
    out = []
    for l in logs:
        admin_name = "Admin"
        admin_user = db.query(User).filter(User.id == l.admin_id).first()
        if admin_user:
            admin_name = admin_user.name
            
        out.append(AuditLogResponse(
            id=l.id,
            admin_id=l.admin_id,
            admin_name=admin_name,
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            reason=l.reason,
            timestamp=l.timestamp
        ))
    return out


# 10. Finance Splits Ledger reports
@router.get("/finance")
def get_finance_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Read system sales splits ledger."""
    # Group Earnings by user roles
    earnings = db.query(Earning).all()
    
    shopkeeper_total = Decimal("0.00")
    delivery_total = Decimal("0.00")
    
    for e in earnings:
        if e.type == "SHOP_SALE":
            shopkeeper_total += e.amount
        elif e.type == "DELIVERY_PAY":
            delivery_total += e.amount
            
    commission_earned = db.query(func.sum(Commission.amount_earned)).scalar() or Decimal("0.00")
    delivery_fees = db.query(func.sum(Order.delivery_fee)).filter(Order.status == "DELIVERED").scalar() or Decimal("0.00")

    return {
        "shopkeepers": {
            "gross_sales": shopkeeper_total + commission_earned,
            "commission_deducted": commission_earned,
            "net_earnings": shopkeeper_total
        },
        "delivery_partners": {
            "delivery_earnings": delivery_total,
            "deductions": Decimal("0.00"),
            "net_earnings": delivery_total
        },
        "platform": {
            "commission_revenue": commission_earned,
            "delivery_fees_collected": delivery_fees,
            "net_earnings": commission_earned
        }
    }


# 11. Shopkeeper Registration
@router.post("/shopkeepers", status_code=status.HTTP_201_CREATED)
def create_shopkeeper(
    payload: ShopkeeperCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin registers a new shopkeeper account."""
    email_clean = payload.email.strip().lower()
    phone_clean = payload.phone.strip()
    if db.query(User).filter(func.lower(User.email) == email_clean).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")
    if db.query(User).filter(User.phone == phone_clean).first():
        raise HTTPException(status_code=400, detail="A user with this phone number already exists.")
    
    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        phone=phone_clean,
        password_hash=get_password_hash(payload.password),
        role="SHOPKEEPER"
    )
    db.add(new_user)
    db.flush()
    shopkeeper = Shopkeeper(user_id=new_user.id, is_verified=True)
    db.add(shopkeeper)
    db.commit()
    db.refresh(new_user)
    
    log_admin_action(db, current_user.id, "CREATE_SHOPKEEPER", "SHOPKEEPER", new_user.id, f"Created shopkeeper '{new_user.name}' ({new_user.email})")
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone": new_user.phone,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at
    }


# 12. Delivery Partner Registration
@router.post("/delivery-partners", status_code=status.HTTP_201_CREATED)
def create_delivery_partner(
    payload: DeliveryPartnerCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin registers a new delivery partner."""
    email_clean = payload.email.strip().lower()
    phone_clean = payload.phone.strip()
    if db.query(User).filter(func.lower(User.email) == email_clean).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")
    if db.query(User).filter(User.phone == phone_clean).first():
        raise HTTPException(status_code=400, detail="A user with this phone number already exists.")
    
    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        phone=phone_clean,
        password_hash=get_password_hash(payload.password),
        role="DELIVERY_PARTNER"
    )
    db.add(new_user)
    db.flush()
    rider = DeliveryPartner(
        user_id=new_user.id,
        vehicle_type=payload.vehicle_type,
        vehicle_number=payload.vehicle_number,
        is_active=True,
        is_verified=True
    )
    db.add(rider)
    db.commit()
    db.refresh(new_user)
    
    log_admin_action(db, current_user.id, "CREATE_RIDER", "DELIVERY_PARTNER", new_user.id, f"Created delivery rider '{new_user.name}' ({new_user.email})")
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone": new_user.phone,
        "is_active": new_user.is_active,
        "vehicle_type": rider.vehicle_type,
        "vehicle_number": rider.vehicle_number,
        "rating": rider.rating,
        "status": "ONLINE",
        "created_at": new_user.created_at
    }


# 13. Canteen Creation & Modification
@router.post("/shops", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(
    payload: ShopCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin adds a new canteen to a campus."""
    shopkeeper = db.query(Shopkeeper).filter(Shopkeeper.user_id == payload.shopkeeper_id).first()
    if not shopkeeper:
        raise HTTPException(status_code=404, detail="Selected shopkeeper not found.")
    campus = db.query(Campus).filter(Campus.id == payload.campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Selected campus not found.")
    
    shop = Shop(
        name=payload.name.strip(),
        description=payload.description,
        shopkeeper_id=payload.shopkeeper_id,
        campus_id=payload.campus_id,
        phone_number=payload.phone_number,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        delivery_available=payload.delivery_available,
        status="APPROVED",
        is_open=True
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    
    log_admin_action(db, current_user.id, "CREATE_SHOP", "SHOP", shop.id, f"Created canteen '{shop.name}' for campus ID {shop.campus_id}")
    return shop

@router.put("/shops/{shop_id}", response_model=ShopResponse)
def update_shop(
    shop_id: str,
    payload: ShopUpdateAdmin,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin updates canteen metadata or reassigns shopkeeper."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")
    
    if payload.shopkeeper_id is not None:
        sk = db.query(Shopkeeper).filter(Shopkeeper.user_id == payload.shopkeeper_id).first()
        if not sk:
            raise HTTPException(status_code=404, detail="Shopkeeper not found.")
        shop.shopkeeper_id = payload.shopkeeper_id
    if payload.campus_id is not None:
        camp = db.query(Campus).filter(Campus.id == payload.campus_id).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Campus not found.")
        shop.campus_id = payload.campus_id
    if payload.name is not None:
        shop.name = payload.name.strip()
    if payload.description is not None:
        shop.description = payload.description
    if payload.phone_number is not None:
        shop.phone_number = payload.phone_number
    if payload.opening_time is not None:
        shop.opening_time = payload.opening_time
    if payload.closing_time is not None:
        shop.closing_time = payload.closing_time
    if payload.delivery_available is not None:
        shop.delivery_available = payload.delivery_available
    if payload.is_open is not None:
        shop.is_open = payload.is_open
    if payload.status is not None:
        shop.status = payload.status
        
    db.commit()
    db.refresh(shop)
    log_admin_action(db, current_user.id, "UPDATE_SHOP", "SHOP", shop.id, f"Updated canteen '{shop.name}' configuration")
    return shop


# 14. Menu Items CRUD
@router.post("/shops/{shop_id}/items", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
def create_food_item(
    shop_id: str,
    payload: FoodItemCreateAdmin,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a food item for a canteen."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Canteen not found.")
    
    category_id = payload.category_id
    if not category_id:
        cat = db.query(FoodCategory).filter(FoodCategory.shop_id == shop_id).first()
        if not cat:
            cat = FoodCategory(name="General", shop_id=shop_id)
            db.add(cat)
            db.flush()
        category_id = cat.id

    item = FoodItem(
        shop_id=shop_id,
        category_id=category_id,
        name=payload.name.strip(),
        description=payload.description,
        price=payload.price,
        is_veg=payload.is_veg,
        preparation_time=payload.preparation_time,
        is_available=payload.is_available,
        image_url=payload.image_url
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    log_admin_action(db, current_user.id, "CREATE_FOOD_ITEM", "FOOD_ITEM", item.id, f"Added item '{item.name}' to shop '{shop.name}'")
    return item

@router.put("/items/{item_id}", response_model=FoodItemResponse)
def update_food_item(
    item_id: str,
    payload: FoodItemUpdateAdmin,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin updates an existing food item."""
    item = db.query(FoodItem).filter(FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found.")
    
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description
    if payload.price is not None:
        item.price = payload.price
    if payload.category_id is not None:
        item.category_id = payload.category_id
    if payload.is_veg is not None:
        item.is_veg = payload.is_veg
    if payload.preparation_time is not None:
        item.preparation_time = payload.preparation_time
    if payload.is_available is not None:
        item.is_available = payload.is_available
    if payload.image_url is not None:
        item.image_url = payload.image_url
        
    db.commit()
    db.refresh(item)
    log_admin_action(db, current_user.id, "UPDATE_FOOD_ITEM", "FOOD_ITEM", item.id, f"Updated item '{item.name}'")
    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_item(
    item_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin removes a food item from catalog."""
    item = db.query(FoodItem).filter(FoodItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found.")
    item_name = item.name
    db.delete(item)
    db.commit()
    log_admin_action(db, current_user.id, "DELETE_FOOD_ITEM", "FOOD_ITEM", item_id, f"Deleted item '{item_name}'")


# 15. Order Rider Assignment
@router.post("/orders/{order_id}/assign-rider", response_model=OrderResponse)
def assign_order_rider(
    order_id: str,
    payload: OrderAssignRiderPayload,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin assigns or reassigns a delivery rider to an order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    rider = db.query(DeliveryPartner).filter(DeliveryPartner.user_id == payload.delivery_partner_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Delivery rider not found.")
        
    order.delivery_partner_id = payload.delivery_partner_id
    if order.status in ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "READY"]:
        order.status = "ASSIGNED"
        
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    if delivery:
        delivery.delivery_partner_id = payload.delivery_partner_id
        delivery.status = "ASSIGNED"
    else:
        delivery = Delivery(
            order_id=order.id,
            delivery_partner_id=payload.delivery_partner_id,
            status="ASSIGNED"
        )
        db.add(delivery)
        
    db.commit()
    db.refresh(order)
    
    try:
        NotificationService.create_order_notification(db, order, "ASSIGNED")
    except Exception:
        pass
        
    log_admin_action(db, current_user.id, "ASSIGN_RIDER", "ORDER", order.id, f"Assigned rider {payload.delivery_partner_id} to order {order.order_number}")
    return order


# 16. Payments Ledger
@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List payments across orders with order details (zero secrets exposed)."""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    out = []
    for p in payments:
        order = db.query(Order).filter(Order.id == p.order_id).first()
        order_number = order.order_number if order else None
        student_name = None
        shop_name = None
        if order:
            student_user = db.query(User).filter(User.id == order.student_id).first()
            if student_user:
                student_name = student_user.name
            shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
            if shop:
                shop_name = shop.name
        out.append(PaymentResponse(
            id=p.id,
            order_id=p.order_id,
            order_number=order_number,
            amount=p.amount,
            status=p.status,
            gateway=p.gateway,
            transaction_ref=p.transaction_ref,
            created_at=p.created_at,
            student_name=student_name,
            shop_name=shop_name
        ))
    return out


# 17. Reports Analytics
@router.get("/reports")
def get_admin_reports(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Aggregated financial and operational performance metrics."""
    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_week = start_of_today - timedelta(days=7)
    start_of_month = start_of_today - timedelta(days=30)
    
    def calc_period_metrics(start_time):
        orders_q = db.query(Order).filter(Order.created_at >= start_time) if start_time else db.query(Order)
        total_orders = orders_q.count()
        delivered_orders = orders_q.filter(Order.status == "DELIVERED").count()
        cancelled_orders = orders_q.filter(Order.status == "CANCELLED").count()
        gmv = orders_q.filter(Order.status != "CANCELLED").with_entities(func.sum(Order.total_amount)).scalar() or Decimal("0.00")
        delivery_fees = orders_q.filter(Order.status == "DELIVERED").with_entities(func.sum(Order.delivery_fee)).scalar() or Decimal("0.00")
        return {
            "total_orders": total_orders,
            "delivered_orders": delivered_orders,
            "cancelled_orders": cancelled_orders,
            "gmv": float(gmv),
            "delivery_fees": float(delivery_fees)
        }
    
    canteen_stats = []
    shops = db.query(Shop).all()
    for s in shops:
        s_orders = db.query(Order).filter(Order.shop_id == s.id)
        count = s_orders.count()
        delivered = s_orders.filter(Order.status == "DELIVERED").count()
        revenue = s_orders.filter(Order.status != "CANCELLED").with_entities(func.sum(Order.total_amount)).scalar() or Decimal("0.00")
        canteen_stats.append({
            "shop_id": s.id,
            "shop_name": s.name,
            "campus_id": s.campus_id,
            "total_orders": count,
            "delivered_orders": delivered,
            "revenue": float(revenue)
        })
        
    rider_stats = []
    riders = db.query(User, DeliveryPartner).join(DeliveryPartner, User.id == DeliveryPartner.user_id).all()
    for u, d in riders:
        del_count = db.query(Delivery).filter(Delivery.delivery_partner_id == u.id, Delivery.status == "DELIVERED").count()
        rider_stats.append({
            "rider_id": u.id,
            "rider_name": u.name,
            "vehicle_type": d.vehicle_type,
            "rating": float(d.rating) if d.rating else 5.0,
            "completed_deliveries": del_count,
            "is_active": u.is_active
        })
        
    return {
        "today": calc_period_metrics(start_of_today),
        "this_week": calc_period_metrics(start_of_week),
        "this_month": calc_period_metrics(start_of_month),
        "all_time": calc_period_metrics(None),
        "canteens": canteen_stats,
        "riders": rider_stats
    }


# 18. Student Order History
@router.get("/students/{student_id}/orders", response_model=List[OrderResponse])
def get_student_orders(
    student_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve order history for a specific student."""
    return db.query(Order).filter(Order.student_id == student_id).order_by(Order.created_at.desc()).all()

