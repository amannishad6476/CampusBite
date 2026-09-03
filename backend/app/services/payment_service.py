import hmac
import hashlib
import logging
import re
from enum import Enum
from typing import Dict, Any, Optional, List
from decimal import Decimal
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.models.models import Payment, Order, User

logger = logging.getLogger("campusbite.payments")

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentGateway(str, Enum):
    COD = "COD"
    RAZORPAY = "RAZORPAY"
    STRIPE = "STRIPE"
    CASHFREE = "CASHFREE"

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

    verify_payment_signature = verify_razorpay_signature

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


class CashfreeService:
    """
    Production-ready Cashfree Payment Gateway integration service.
    Handles server-side payment order initialization, safe payment session generation,
    and authoritative payment status verification.
    """

    @staticmethod
    def _clean_phone(phone: str) -> str:
        """Extract valid 10-digit mobile number for Cashfree requirements."""
        digits = re.sub(r"\D", "", phone or "")
        if len(digits) >= 10:
            return digits[-10:]
        return "9876543210"

    @classmethod
    def create_payment_session(
        cls,
        db: Session,
        order: Order,
        student: User
    ) -> Dict[str, Any]:
        """
        Initializes a payment order session on Cashfree server-side and returns
        safe payment session information for the mobile app (no secrets).
        """
        client_id = settings.cashfree_client_id
        client_secret = settings.cashfree_client_secret

        if not client_id or not client_secret:
            logger.error("Cashfree credentials missing in backend environment.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cashfree payment gateway credentials are not configured on the server. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY."
            )

        if order.payment_status == "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This order has already been paid."
            )

        if order.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot initiate payment for a cancelled order."
            )

        headers = {
            "x-client-id": client_id,
            "x-client-secret": client_secret,
            "x-api-version": settings.CASHFREE_API_VERSION,
            "Content-Type": "application/json"
        }

        phone_cleaned = cls._clean_phone(student.phone)
        order_amount = float(order.total_amount)

        payload = {
            "order_id": order.id,
            "order_amount": order_amount,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": str(student.id),
                "customer_name": student.name or "Student",
                "customer_email": student.email,
                "customer_phone": phone_cleaned
            },
            "order_meta": {
                "return_url": f"campusbite://payment-return?order_id={order.id}"
            }
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    f"{settings.cashfree_base_url}/orders",
                    headers=headers,
                    json=payload
                )

            if resp.status_code not in (200, 201):
                err_body = resp.text
                logger.error(f"Cashfree create order error {resp.status_code}: {err_body}")
                try:
                    err_json = resp.json()
                    detail_msg = err_json.get("message") or f"Payment gateway error: {resp.status_code}"
                except Exception:
                    detail_msg = f"Payment gateway initialization failed with status {resp.status_code}"
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=detail_msg
                )

            resp_data = resp.json()
            payment_session_id = resp_data.get("payment_session_id")
            cf_order_id = resp_data.get("cf_order_id")

            if not payment_session_id:
                logger.error(f"Cashfree response missing payment_session_id: {resp_data}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to obtain payment session from payment gateway."
                )

            # Try to fetch dynamic QR data via Cashfree Order Pay session API if available
            qr_data = None
            try:
                with httpx.Client(timeout=8.0) as client:
                    pay_resp = client.post(
                        f"{settings.cashfree_base_url}/orders/sessions",
                        headers={
                            "x-api-version": settings.CASHFREE_API_VERSION,
                            "Content-Type": "application/json"
                        },
                        json={
                            "payment_session_id": payment_session_id,
                            "payment_method": {
                                "upi": {
                                    "channel": "qrcode"
                                }
                            }
                        }
                    )
                    if pay_resp.status_code in (200, 201):
                        pay_data = pay_resp.json()
                        payload_data = pay_data.get("data", {}).get("payload", {})
                        qr_data = payload_data.get("qrcode") or payload_data.get("qrcode_url") or pay_data.get("data", {}).get("qr_code")
            except Exception as qr_err:
                logger.warning(f"Could not retrieve dynamic QR payload: {qr_err}")

            # Record or update payment record in database
            payment = db.query(Payment).filter(Payment.order_id == order.id).first()
            if not payment:
                payment = Payment(
                    order_id=order.id,
                    amount=order.total_amount,
                    status=PaymentStatus.PENDING.value,
                    gateway=PaymentGateway.CASHFREE.value,
                    transaction_ref=str(cf_order_id) if cf_order_id else None
                )
                db.add(payment)
            else:
                payment.status = PaymentStatus.PENDING.value
                payment.gateway = PaymentGateway.CASHFREE.value
                if cf_order_id:
                    payment.transaction_ref = str(cf_order_id)

            db.commit()

            return {
                "order_id": order.id,
                "order_number": order.order_number,
                "cf_order_id": str(cf_order_id) if cf_order_id else None,
                "payment_session_id": payment_session_id,
                "environment": str(settings.CASHFREE_ENVIRONMENT).upper(),
                "amount": order.total_amount,
                "currency": "INR",
                "qr_data": qr_data
            }

        except HTTPException:
            raise
        except httpx.RequestError as exc:
            logger.error(f"Network error connecting to Cashfree API: {exc}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Connection to payment gateway timed out. Please try again."
            )
        except Exception as exc:
            logger.error(f"Unexpected error creating Cashfree payment session: {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while preparing your payment."
            )

    @classmethod
    def verify_order_payment(
        cls,
        db: Session,
        order: Order
    ) -> Dict[str, Any]:
        """
        Authoritative server-side verification of payment status via Cashfree PG API.
        Only updates order payment_status to 'PAID' when Cashfree verifies success.
        """
        if order.payment_status == "PAID":
            return {
                "order_id": order.id,
                "payment_status": "PAID",
                "order_status": order.status,
                "transaction_ref": None,
                "message": "Order is already marked as PAID."
            }

        client_id = settings.cashfree_client_id
        client_secret = settings.cashfree_client_secret

        if not client_id or not client_secret:
            logger.error("Cashfree credentials missing for payment verification.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cashfree payment gateway credentials are not configured on the server."
            )

        headers = {
            "x-client-id": client_id,
            "x-client-secret": client_secret,
            "x-api-version": settings.CASHFREE_API_VERSION,
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                # 1. Inspect payments list for order
                resp = client.get(
                    f"{settings.cashfree_base_url}/orders/{order.id}/payments",
                    headers=headers
                )

                if resp.status_code == 200:
                    payments_list = resp.json()
                    if isinstance(payments_list, list):
                        for p in payments_list:
                            p_status = str(p.get("payment_status", "")).upper()
                            if p_status == "SUCCESS":
                                txn_ref = str(p.get("cf_payment_id") or p.get("bank_reference") or "")
                                # Update Payment record
                                payment = db.query(Payment).filter(Payment.order_id == order.id).first()
                                if payment:
                                    payment.status = PaymentStatus.SUCCESS.value
                                    payment.transaction_ref = txn_ref
                                # Update Order
                                order.payment_status = "PAID"
                                db.commit()
                                db.refresh(order)
                                return {
                                    "order_id": order.id,
                                    "payment_status": "PAID",
                                    "order_status": order.status,
                                    "transaction_ref": txn_ref,
                                    "message": "Payment verified successfully."
                                }

                        # Check if any payment attempt failed / cancelled
                        for p in payments_list:
                            p_status = str(p.get("payment_status", "")).upper()
                            if p_status in ("FAILED", "USER_DROPPED", "CANCELLED"):
                                payment = db.query(Payment).filter(Payment.order_id == order.id).first()
                                if payment:
                                    payment.status = PaymentStatus.FAILED.value
                                db.commit()
                                return {
                                    "order_id": order.id,
                                    "payment_status": "FAILED",
                                    "order_status": order.status,
                                    "transaction_ref": None,
                                    "message": p.get("payment_message") or "Payment was unsuccessful or cancelled by user."
                                }

                # 2. Fallback: Inspect order entity status directly
                order_resp = client.get(
                    f"{settings.cashfree_base_url}/orders/{order.id}",
                    headers=headers
                )
                if order_resp.status_code == 200:
                    order_data = order_resp.json()
                    cf_status = str(order_data.get("order_status", "")).upper()
                    if cf_status == "PAID":
                        order.payment_status = "PAID"
                        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
                        if payment:
                            payment.status = PaymentStatus.SUCCESS.value
                        db.commit()
                        db.refresh(order)
                        return {
                            "order_id": order.id,
                            "payment_status": "PAID",
                            "order_status": order.status,
                            "transaction_ref": None,
                            "message": "Payment verified successfully via order status."
                        }

            return {
                "order_id": order.id,
                "payment_status": "PENDING",
                "order_status": order.status,
                "transaction_ref": None,
                "message": "Payment is currently pending verification."
            }

        except HTTPException:
            raise
        except httpx.RequestError as exc:
            logger.error(f"Network error verifying Cashfree payment: {exc}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Connection to payment gateway timed out during verification."
            )
        except Exception as exc:
            logger.error(f"Error during Cashfree payment verification: {exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while verifying payment status."
            )

