from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import random
import string
import logging

from app.core.database import get_db
from app.api.deps import RoleChecker
from app.models.models import User, DeliveryPartner, Delivery, Order, Earning, Commission, Shop, Notification
from app.schemas.delivery import (
    DeliveryPartnerProfile,
    AvailabilityUpdate,
    VerifyOtpPayload,
    DeliveryEarningSummary,
    LocationUpdatePayload,
    DeliveryPartnerProfileUpdate,
    UnassignPayload,
    EarningHistoryResponse,
    EarningHistoryItem,
)
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.schemas.order import OrderResponse
from app.services.notification_service import NotificationService


logger = logging.getLogger("campusbite.delivery")
router = APIRouter()
require_delivery = RoleChecker(["DELIVERY_PARTNER"])

def get_partner_profile_or_raise(user_id: str, db: Session) -> DeliveryPartner:
    """Retrieve the DeliveryPartner entry for a user."""
    partner = db.query(DeliveryPartner).filter(DeliveryPartner.user_id == user_id).first()
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery partner profile not registered."
        )
    return partner

def get_partner_status(partner: DeliveryPartner, db: Session) -> str:
    """Dynamically determine driver availability status."""
    if not partner.is_active:
        return "OFFLINE"
    
    # Check if they are busy on an active delivery assignment
    active_delivery = db.query(Delivery).filter(
        Delivery.delivery_partner_id == partner.user_id,
        Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
    ).first()
    
    return "BUSY" if active_delivery else "ONLINE"


# 1. Profile and Availability
@router.get("/me", response_model=DeliveryPartnerProfile)
def get_my_profile(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve driver profile details with dynamic status updates."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    status_str = get_partner_status(partner, db)
    
    return DeliveryPartnerProfile(
        user_id=partner.user_id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        vehicle_type=partner.vehicle_type,
        vehicle_number=partner.vehicle_number,
        rating=partner.rating,
        is_active=partner.is_active,
        status=status_str
    )

@router.patch("/me/availability", response_model=DeliveryPartnerProfile)
def update_availability(
    payload: AvailabilityUpdate,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Toggle online/offline status."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    partner.is_active = payload.is_active
    db.commit()
    db.refresh(partner)
    
    status_str = get_partner_status(partner, db)
    return DeliveryPartnerProfile(
        user_id=partner.user_id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        vehicle_type=partner.vehicle_type,
        vehicle_number=partner.vehicle_number,
        rating=partner.rating,
        is_active=partner.is_active,
        status=status_str
    )


@router.patch("/me/location")
def update_location(
    payload: LocationUpdatePayload,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Update driver's live GPS coordinates."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    partner.current_lat = payload.latitude
    partner.current_lng = payload.longitude
    db.commit()
    return {
        "status": "success",
        "current_lat": float(partner.current_lat),
        "current_lng": float(partner.current_lng)
    }


@router.put("/me/profile", response_model=DeliveryPartnerProfile)
def update_profile(
    payload: DeliveryPartnerProfileUpdate,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Update delivery partner profile information."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    if payload.name:
        current_user.name = payload.name.strip()
    if payload.phone:
        clean_phone = payload.phone.strip()
        existing = db.query(User).filter(User.phone == clean_phone, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already in use.")
        current_user.phone = clean_phone
    if payload.vehicle_type:
        partner.vehicle_type = payload.vehicle_type.strip()
    if payload.vehicle_number is not None:
        partner.vehicle_number = payload.vehicle_number.strip() if payload.vehicle_number else None
    
    db.commit()
    db.refresh(partner)
    db.refresh(current_user)
    
    status_str = get_partner_status(partner, db)
    return DeliveryPartnerProfile(
        user_id=partner.user_id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        vehicle_type=partner.vehicle_type,
        vehicle_number=partner.vehicle_number,
        rating=partner.rating,
        is_active=partner.is_active,
        status=status_str
    )



# 2. Orders Search
@router.get("/available-orders", response_model=List[OrderResponse])
def get_available_orders(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """List orders that are READY_FOR_PICKUP and not yet assigned to any driver."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    
    orders = db.query(Order).filter(
        Order.status == "READY_FOR_PICKUP",
        Order.delivery_partner_id.is_(None)
    ).all()
    
    # Populate shop_name fallback
    for order in orders:
        shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
        if shop:
            order.shop_name = shop.name
            
    return orders


# 3. Order Assignments (Accept, Active, History, Details)
@router.post("/orders/{order_id}/accept", response_model=OrderResponse)
def accept_delivery(
    order_id: str,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Atomically claim an order using row locking."""
    partner = get_partner_profile_or_raise(current_user.id, db)
    if not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot accept deliveries while offline. Go online first."
        )
        
    # Check if driver is already holding an active delivery assignment
    active = db.query(Delivery).filter(
        Delivery.delivery_partner_id == current_user.id,
        Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
    ).first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active order assignment in progress."
        )

    # Locking row
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )

    if order.status != "READY_FOR_PICKUP" or order.delivery_partner_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery already assigned to another partner or order is not ready."
        )

    order.delivery_partner_id = current_user.id
    order.status = "ASSIGNED"

    # Create Delivery tracking entry
    delivery = Delivery(
        order_id=order.id,
        delivery_partner_id=current_user.id,
        status="ASSIGNED",
        assigned_at=datetime.now(timezone.utc),
        otp_verified=False,
        otp_attempts=0
    )
    db.add(delivery)
    db.commit()
    db.refresh(order)
    
    try:
        NotificationService.create_rider_assignment_notification(db, order, current_user.id)
    except Exception as e:
        logger.warning(f"Could not dispatch rider assignment notification: {e}")
    
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        order.shop_name = shop.name
        
    return order

@router.get("/orders/active", response_model=Optional[OrderResponse])
def get_active_order(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve the driver's current active delivery assignment."""
    order = db.query(Order).filter(
        Order.delivery_partner_id == current_user.id,
        Order.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active delivery assignment found."
        )
        
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        order.shop_name = shop.name
        
    return order

@router.get("/orders/history", response_model=List[OrderResponse])
def get_delivery_history(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve the driver's completed and cancelled deliveries."""
    orders = db.query(Order).filter(
        Order.delivery_partner_id == current_user.id,
        Order.status.in_(["DELIVERED", "CANCELLED"])
    ).order_by(Order.created_at.desc()).all()
    
    for order in orders:
        shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
        if shop:
            order.shop_name = shop.name
            
    return orders

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: str,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific assigned order."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or access denied."
        )
        
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        order.shop_name = shop.name
        
    return order


@router.post("/orders/{order_id}/unassign")
def unassign_order(
    order_id: str,
    payload: Optional[UnassignPayload] = None,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Emergency drop / unassign before pickup, returning order to the available pool."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or not assigned to you."
        )

    if order.status != "ASSIGNED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot unassign order in '{order.status}' state. Only orders awaiting pickup can be unassigned."
        )

    # Revert order back to READY_FOR_PICKUP pool
    order.delivery_partner_id = None
    order.status = "READY_FOR_PICKUP"

    # Mark delivery tracking as FAILED
    delivery = db.query(Delivery).filter(
        Delivery.order_id == order_id,
        Delivery.delivery_partner_id == current_user.id
    ).first()
    if delivery:
        delivery.status = "FAILED"

    db.commit()
    db.refresh(order)
    return {
        "status": "unassigned",
        "order_id": order.id,
        "order_status": order.status,
        "message": "Order successfully released back to the pickup pool."
    }


# 4. Status Progress Workflows

@router.post("/orders/{order_id}/pickup", response_model=OrderResponse)
def mark_order_picked_up(
    order_id: str,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Transition delivery state from ASSIGNED to PICKED_UP."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status != "ASSIGNED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition: Cannot mark picked up from status '{order.status}'."
        )

    order.status = "PICKED_UP"
    
    delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if delivery:
        delivery.status = "PICKED_UP"
        delivery.picked_up_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(order)
    
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        order.shop_name = shop.name
        
    return order

@router.post("/orders/{order_id}/start", response_model=OrderResponse)
def start_order_delivery(
    order_id: str,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Transition delivery state from PICKED_UP to OUT_FOR_DELIVERY. Generates a secure hashed OTP."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status != "PICKED_UP":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition: Cannot start delivery from status '{order.status}'."
        )

    # Generate a 4-digit code
    otp_code = "".join(random.choices(string.digits, k=4))
    
    # Store plain text in Order so that student can fetch it via API
    order.otp = otp_code
    order.status = "OUT_FOR_DELIVERY"

    # Store SHA-256 hash in Delivery model
    otp_hash = hashlib.sha256(otp_code.encode()).hexdigest()
    
    delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if delivery:
        delivery.status = "OUT_FOR_DELIVERY"
        delivery.out_for_delivery_at = datetime.now(timezone.utc)
        delivery.otp_hash = otp_hash
        delivery.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        delivery.otp_attempts = 0
        
    db.commit()
    db.refresh(order)

    try:
        NotificationService.create_order_notification(db, order, "OUT_FOR_DELIVERY")
    except Exception as notif_err:
        logger.warning(f"Could not dispatch out for delivery notification: {notif_err}")
    
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        order.shop_name = shop.name
        
    return order

@router.post("/orders/{order_id}/verify-otp", response_model=OrderResponse)
def verify_delivery_otp(
    order_id: str,
    payload: VerifyOtpPayload,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Verify security OTP. On success, transitions state to DELIVERED and logs earnings."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.delivery_partner_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status != "OUT_FOR_DELIVERY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in the OUT_FOR_DELIVERY phase."
        )

    delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery tracking record not found.")

    # Expiry Check
    if delivery.otp_expires_at:
        expiry = delivery.otp_expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Restart delivery to generate a new OTP."
            )

    # Brute Force check
    if delivery.otp_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect verification attempts. Account locked for this delivery."
        )

    # Increment attempts
    delivery.otp_attempts += 1
    
    # Hash check
    input_hash = hashlib.sha256(payload.otp.encode()).hexdigest()
    if input_hash != delivery.otp_hash:
        db.commit()  # Save attempts increment
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Verification failed."
        )

    # Validated!
    delivery.otp_verified = True
    delivery.status = "DELIVERED"
    delivery.delivered_at = datetime.now(timezone.utc)
    
    order.status = "DELIVERED"
    order.payment_status = "PAID"

    # LOG EARNINGS & COMMISSIONS SERVER-SIDE
    # 1. Delivery Partner Earning
    dp_earning = Earning(
        user_id=current_user.id,
        amount=order.delivery_fee,
        type="DELIVERY_PAY",
        order_id=order.id,
        status="UNPAID",
        created_at=datetime.now(timezone.utc)
    )
    db.add(dp_earning)

    # 2. Commission Rate check
    commission_rate = Decimal("0.10")
    commission_amount = order.subtotal * commission_rate
    shopkeeper_share = order.subtotal - commission_amount

    # Find Canteen Owner
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        sk_earning = Earning(
            user_id=shop.shopkeeper_id,
            amount=shopkeeper_share,
            type="SHOP_SALE",
            order_id=order.id,
            status="UNPAID",
            created_at=datetime.now(timezone.utc)
        )
        db.add(sk_earning)

        commission = Commission(
            order_id=order.id,
            shop_id=shop.id,
            order_total=order.subtotal,
            percentage=Decimal("10.00"),
            amount_earned=commission_amount
        )
        db.add(commission)

    db.commit()
    db.refresh(order)

    try:
        NotificationService.create_order_notification(db, order, "DELIVERED")
    except Exception as notif_err:
        logger.warning(f"Could not dispatch delivered notification: {notif_err}")
    
    if shop:
        order.shop_name = shop.name
        
    return order


# 5. Driver Payout Metrics
@router.get("/earnings", response_model=DeliveryEarningSummary)
def get_my_earnings(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve driver payout summaries."""
    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day)
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)

    # 1. Today's Payouts
    today_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "DELIVERY_PAY",
        Earning.created_at >= start_of_today
    ).scalar() or Decimal("0.00")

    # 2. Weekly Payouts
    weekly_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "DELIVERY_PAY",
        Earning.created_at >= one_week_ago
    ).scalar() or Decimal("0.00")

    # 3. Monthly Payouts
    monthly_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "DELIVERY_PAY",
        Earning.created_at >= one_month_ago
    ).scalar() or Decimal("0.00")

    # 4. Total Payouts (net)
    net_earnings = db.query(func.sum(Earning.amount)).filter(
        Earning.user_id == current_user.id,
        Earning.type == "DELIVERY_PAY"
    ).scalar() or Decimal("0.00")

    # 5. Completed counter
    total_deliveries = db.query(func.count(Order.id)).filter(
        Order.delivery_partner_id == current_user.id,
        Order.status == "DELIVERED"
    ).scalar() or 0

    return DeliveryEarningSummary(
        today_earnings=today_earnings,
        weekly_earnings=weekly_earnings,
        monthly_earnings=monthly_earnings,
        total_deliveries=total_deliveries,
        delivery_fee_earned=net_earnings,
        net_earnings=net_earnings
    )


@router.get("/earnings/history", response_model=EarningHistoryResponse)
def get_earnings_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve detailed itemized list of driver earnings."""
    offset = max(0, (page - 1) * limit)
    query = db.query(Earning).filter(
        Earning.user_id == current_user.id,
        Earning.type == "DELIVERY_PAY"
    ).order_by(Earning.created_at.desc())

    total = query.count()
    earnings = query.offset(offset).limit(limit).all()

    items = []
    for e in earnings:
        order_num = None
        s_name = None
        if e.order_id:
            ord_row = db.query(Order).filter(Order.id == e.order_id).first()
            if ord_row:
                order_num = ord_row.order_number
                sh = db.query(Shop).filter(Shop.id == ord_row.shop_id).first()
                if sh:
                    s_name = sh.name

        items.append(EarningHistoryItem(
            id=e.id,
            order_id=e.order_id,
            order_number=order_num,
            shop_name=s_name,
            amount=e.amount,
            type=e.type,
            status=e.status,
            created_at=e.created_at.isoformat() if e.created_at else None
        ))

    return EarningHistoryResponse(
        total_records=total,
        items=items
    )


# 6. Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
def get_rider_notifications(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Retrieve in-app notifications for the authenticated rider."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def get_rider_unread_count(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications for badge counters."""
    cnt = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return UnreadCountResponse(unread_count=cnt)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_rider_notification_read(
    notification_id: str,
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/notifications/read-all")
def mark_all_rider_notifications_read(
    current_user: User = Depends(require_delivery),
    db: Session = Depends(get_db)
):
    """Mark all notifications for the current rider as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read."}

