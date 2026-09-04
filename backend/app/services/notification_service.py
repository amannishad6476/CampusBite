import logging
from typing import Optional, Any
from enum import Enum
from sqlalchemy.orm import Session
from app.models.models import Notification, Order

logger = logging.getLogger("campusbite.notifications")

class NotificationEvent(str, Enum):
    ORDER_PLACED = "ORDER_PLACED"
    ORDER_ACCEPTED = "ORDER_ACCEPTED"
    ORDER_PREPARING = "ORDER_PREPARING"
    ORDER_READY = "ORDER_READY"
    ORDER_PICKED_UP = "ORDER_PICKED_UP"
    ORDER_OUT_FOR_DELIVERY = "ORDER_OUT_FOR_DELIVERY"
    ORDER_DELIVERED = "ORDER_DELIVERED"
    ORDER_CANCELLED = "ORDER_CANCELLED"

STATUS_NOTIFICATION_MAP = {
    "PLACED": {
        "type": "ORDER_PLACED",
        "title": "Order Placed! 🍔",
        "message": "Your order #{order_number} has been placed successfully."
    },
    "ACCEPTED": {
        "type": "ORDER_ACCEPTED",
        "title": "Order Accepted! ✅",
        "message": "Canteen accepted your order #{order_number}."
    },
    "PREPARING": {
        "type": "ORDER_PREPARING",
        "title": "Preparing Food! 👨‍🍳",
        "message": "Your food for order #{order_number} is being freshly prepared."
    },
    "READY_FOR_PICKUP": {
        "type": "ORDER_READY",
        "title": "Order Ready! 📦",
        "message": "Order #{order_number} is packed and ready for pickup."
    },
    "OUT_FOR_DELIVERY": {
        "type": "ORDER_OUT_FOR_DELIVERY",
        "title": "Out for Delivery! 🛵",
        "message": "Your order #{order_number} is on the way! Delivery OTP: {otp}."
    },
    "DELIVERED": {
        "type": "ORDER_DELIVERED",
        "title": "Order Delivered! 🎉",
        "message": "Order #{order_number} has been delivered. Enjoy your meal! Please rate your canteen experience."
    },
    "CANCELLED": {
        "type": "ORDER_CANCELLED",
        "title": "Order Cancelled ❌",
        "message": "Your order #{order_number} has been cancelled."
    }
}

class NotificationService:
    @staticmethod
    def create_order_notification(
        db: Session,
        order: Order,
        status_event: str,
        custom_title: Optional[str] = None,
        custom_message: Optional[str] = None
    ) -> Optional[Notification]:
        """
        Creates a persistent in-app notification for a student upon order status events.
        Includes strict deduplication so identical events do not spam duplicate notifications.
        """
        event_key = status_event.upper()
        event_config = STATUS_NOTIFICATION_MAP.get(event_key)
        if not event_config:
            logger.debug(f"No notification template configured for status event: {status_event}")
            return None

        notif_type = event_config["type"]
        title = custom_title or event_config["title"]
        message = custom_message or event_config["message"].format(
            order_number=order.order_number,
            otp=order.otp or ""
        )

        # Deduplication check: Do not re-create if identical status notification already exists
        existing = db.query(Notification).filter(
            Notification.user_id == order.student_id,
            Notification.order_id == order.id,
            Notification.type == notif_type
        ).first()

        if existing:
            logger.debug(f"Notification {notif_type} for order {order.id} already exists. Skipping duplicate.")
            return existing

        notif = Notification(
            user_id=order.student_id,
            order_id=order.id,
            title=title,
            message=message,
            type=notif_type,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        logger.info(f"Notification '{title}' created for user {order.student_id} on order {order.order_number}")
        return notif

    @staticmethod
    def create_shopkeeper_order_notification(
        db: Session,
        order: Order,
        shop: Any
    ) -> Optional[Notification]:
        """
        Creates a persistent in-app notification for the shopkeeper when a new order is placed.
        """
        if not getattr(shop, "shopkeeper_id", None):
            return None

        title = "New Order Received! 🔔"
        message = f"New order #{order.order_number} has been placed for your canteen."

        existing = db.query(Notification).filter(
            Notification.user_id == shop.shopkeeper_id,
            Notification.order_id == order.id,
            Notification.type == "ORDER_PLACED"
        ).first()

        if existing:
            return existing

        notif = Notification(
            user_id=shop.shopkeeper_id,
            order_id=order.id,
            title=title,
            message=message,
            type="ORDER_PLACED",
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        logger.info(f"Shopkeeper notification created for user {shop.shopkeeper_id} on order {order.order_number}")
        return notif

    @staticmethod
    def notify_student(user_id: str, order_number: str, event: Any) -> bool:
        """Mock helper for legacy tests / notification dispatch simulation."""
        logger.info(f"Notify student {user_id} for order {order_number} event {event}")
        return True

    @staticmethod
    def notify_shopkeeper_new_order(shop_id: str, order_number: str, item_count: int) -> bool:
        """Mock helper for shopkeeper notification dispatch simulation."""
        logger.info(f"Notify shopkeeper {shop_id} for order {order_number} ({item_count} items)")
        return True

    @staticmethod
    def notify_delivery_assignment(driver_id: str, order_number: str, pickup_location: str) -> bool:
        """Mock helper for driver notification dispatch simulation."""
        logger.info(f"Notify driver {driver_id} for order {order_number} at {pickup_location}")
        return True
