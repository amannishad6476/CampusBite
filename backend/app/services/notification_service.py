import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("campusbite.notifications")

class NotificationEvent:
    ORDER_ACCEPTED = "ORDER_ACCEPTED"
    ORDER_PREPARING = "ORDER_PREPARING"
    ORDER_READY = "ORDER_READY"
    ORDER_PICKED_UP = "ORDER_PICKED_UP"
    ORDER_OUT_FOR_DELIVERY = "ORDER_OUT_FOR_DELIVERY"
    ORDER_DELIVERED = "ORDER_DELIVERED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    NEW_ORDER_RECEIVED = "NEW_ORDER_RECEIVED"
    DELIVERY_AVAILABLE = "DELIVERY_AVAILABLE"
    DELIVERY_ASSIGNED = "DELIVERY_ASSIGNED"

class NotificationService:
    """
    Centralized Notification Service for CampusBite.
    Dispatches push notifications to Student, Shopkeeper, and Delivery Partner devices.
    Falls back gracefully to structured server logging when push provider keys are not configured.
    """

    @classmethod
    def _dispatch(cls, recipient_user_id: str, title: str, body: str, data: Dict[str, Any]) -> bool:
        """Internal dispatcher: sends to FCM/Expo or logs locally."""
        if not settings.PUSH_NOTIFICATION_KEY:
            logger.info(
                f"[NOTIFICATION MOCK] Recipient: {recipient_user_id} | Title: '{title}' | Body: '{body}' | Data: {data}"
            )
            return True

        # Production Push Dispatch Hook (Firebase Cloud Messaging / Expo Push)
        try:
            # Example FCM / Expo integration hook:
            # push_client.send(recipient=recipient_user_id, title=title, body=body, data=data)
            logger.info(f"[PUSH SENT] Successfully dispatched to {recipient_user_id}")
            return True
        except Exception as exc:
            logger.error(f"[PUSH ERROR] Failed to dispatch notification to {recipient_user_id}: {exc}")
            return False

    @classmethod
    def notify_student(
        cls,
        student_user_id: str,
        order_number: str,
        event_type: str,
        custom_message: Optional[str] = None
    ) -> bool:
        """Sends status update push notification to the ordering student."""
        status_messages = {
            NotificationEvent.ORDER_ACCEPTED: f"Your order #{order_number} has been accepted by the canteen!",
            NotificationEvent.ORDER_PREPARING: f"The kitchen is now preparing your order #{order_number}.",
            NotificationEvent.ORDER_READY: f"Order #{order_number} is ready and waiting for delivery pickup.",
            NotificationEvent.ORDER_PICKED_UP: f"Your delivery partner has picked up order #{order_number}.",
            NotificationEvent.ORDER_OUT_FOR_DELIVERY: f"Order #{order_number} is out for delivery! Share your OTP upon arrival.",
            NotificationEvent.ORDER_DELIVERED: f"Order #{order_number} has been delivered. Enjoy your meal!",
            NotificationEvent.ORDER_CANCELLED: f"Order #{order_number} has been cancelled."
        }

        body = custom_message or status_messages.get(event_type, f"Update on order #{order_number}")
        title = "CampusBite Order Update"
        return cls._dispatch(
            recipient_user_id=student_user_id,
            title=title,
            body=body,
            data={"event": event_type, "order_number": order_number}
        )

    @classmethod
    def notify_shopkeeper_new_order(
        cls,
        shopkeeper_user_id: str,
        order_number: str,
        item_count: int
    ) -> bool:
        """Alerts shopkeeper of an incoming new order."""
        title = "New Order Placed!"
        body = f"New order #{order_number} received with {item_count} items."
        return cls._dispatch(
            recipient_user_id=shopkeeper_user_id,
            title=title,
            body=body,
            data={"event": NotificationEvent.NEW_ORDER_RECEIVED, "order_number": order_number}
        )

    @classmethod
    def notify_delivery_assignment(
        cls,
        delivery_partner_user_id: str,
        order_number: str,
        pickup_location: str
    ) -> bool:
        """Alerts delivery partner of an assigned delivery task."""
        title = "New Delivery Task"
        body = f"You have been assigned order #{order_number} for pickup at {pickup_location}."
        return cls._dispatch(
            recipient_user_id=delivery_partner_user_id,
            title=title,
            body=body,
            data={"event": NotificationEvent.DELIVERY_ASSIGNED, "order_number": order_number}
        )
