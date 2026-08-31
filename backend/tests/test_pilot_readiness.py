import pytest
from decimal import Decimal
from sqlalchemy.orm import Session
from app.services.notification_service import NotificationService, NotificationEvent
from app.services.rate_limiter import InMemoryRateLimiter
from app.services.payment_service import PaymentService, PaymentStatus, PaymentGateway
from app.scripts.seed_pilot_data import seed_pilot_dataset
from app.models.models import College, Shop, User, FoodItem

def test_notification_service_mock_dispatch():
    """Verify notification service handles dispatch for all roles gracefully without crashing."""
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_ACCEPTED) is True
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_PREPARING) is True
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_READY) is True
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_PICKED_UP) is True
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_OUT_FOR_DELIVERY) is True
    assert NotificationService.notify_student("student-123", "CB-2026-0001", NotificationEvent.ORDER_DELIVERED) is True
    assert NotificationService.notify_shopkeeper_new_order("shop-123", "CB-2026-0001", 3) is True
    assert NotificationService.notify_delivery_assignment("dp-123", "CB-2026-0001", "Central Cafeteria") is True

def test_rate_limiter_sliding_window():
    """Verify rate limiter blocks when threshold is reached and resets properly."""
    limiter = InMemoryRateLimiter()
    key = "ip:192.168.1.50:login"

    # Allow up to 3 requests per 10 seconds
    assert limiter.is_rate_limited(key, max_requests=3, window_seconds=10) is False
    assert limiter.is_rate_limited(key, max_requests=3, window_seconds=10) is False
    assert limiter.is_rate_limited(key, max_requests=3, window_seconds=10) is False
    # 4th request must be throttled
    assert limiter.is_rate_limited(key, max_requests=3, window_seconds=10) is True

    # Clear and verify reset
    limiter.clear(key)
    assert limiter.is_rate_limited(key, max_requests=3, window_seconds=10) is False

def test_payment_service_signature_verification():
    """Verify payment signature verification algorithm."""
    order_id = "order_987213"
    payment_id = "pay_888123"
    secret = "test_webhook_secret_key"

    # Generate expected HMAC
    import hmac
    import hashlib
    payload_str = f"{order_id}|{payment_id}"
    valid_signature = hmac.new(
        secret.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    assert PaymentService.verify_payment_signature(order_id, payment_id, valid_signature, secret) is True
    assert PaymentService.verify_payment_signature(order_id, payment_id, "invalid_sig", secret) is False

def test_pilot_dataset_seeding(db: Session):
    """Verify the dynamic multi-college pilot seeder correctly generates all 6 colleges and canteens."""
    result = seed_pilot_dataset(db)
    assert result["status"] == "success"
    assert result["colleges_count"] == 6
    assert result["shops_count"] == 6

    # Verify colleges in database
    colleges = db.query(College).all()
    assert len(colleges) >= 6

    # Verify shops and menu items
    shops = db.query(Shop).all()
    assert len(shops) >= 6
    for s in shops:
        assert s.status == "ACTIVE"
        items = db.query(FoodItem).filter(FoodItem.shop_id == s.id).all()
        assert len(items) >= 4

    # Verify pilot users
    admin = db.query(User).filter(User.email == "admin@campusbite.com").first()
    assert admin is not None
    assert admin.role == "ADMIN"
