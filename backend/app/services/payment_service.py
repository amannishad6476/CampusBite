import hmac
import hashlib
from enum import Enum
from typing import Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.models import Payment, Order

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentGateway(str, Enum):
    COD = "COD"
    RAZORPAY = "RAZORPAY"
    STRIPE = "STRIPE"

class PaymentService:
    """
    Abstract Payment Service for handling payment gateway integrations (Razorpay, Stripe, COD).
    Ensures all payment verifications and status transitions happen strictly server-side.
    """

    @staticmethod
    def create_payment_record(
        db: Session,
        order: Order,
        gateway: PaymentGateway = PaymentGateway.COD
    ) -> Payment:
        """Create a new payment record in PENDING state."""
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount,
            status=PaymentStatus.PENDING.value,
            gateway=gateway.value,
            transaction_ref=None
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def verify_razorpay_signature(
        order_id: str,
        payment_id: str,
        signature: str,
        secret_key: str
    ) -> bool:
        """
        Server-side HMAC-SHA256 signature verification for Razorpay payments.
        Never trust client-reported success without verifying signature.
        """
        if not secret_key or not signature:
            return False
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            secret_key.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)

    @staticmethod
    def process_payment_confirmation(
        db: Session,
        payment_id: str,
        transaction_ref: str,
        status: PaymentStatus
    ) -> Optional[Payment]:
        """
        Finalize payment status server-side and synchronize with parent order.
        """
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return None

        payment.status = status.value
        payment.transaction_ref = transaction_ref

        order = db.query(Order).filter(Order.id == payment.order_id).first()
        if order:
            if status == PaymentStatus.SUCCESS:
                order.payment_status = "PAID"
            elif status == PaymentStatus.FAILED:
                order.payment_status = "FAILED"
            elif status == PaymentStatus.REFUNDED:
                order.payment_status = "REFUNDED"

        db.commit()
        db.refresh(payment)
        return payment
