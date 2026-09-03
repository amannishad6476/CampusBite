from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

class OrderItemCreate(BaseModel):
    food_item_id: str
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None

class DeliveryAddressSchema(BaseModel):
    campus_name: str
    college_name: Optional[str] = None
    block_name: Optional[str] = None
    hostel_name: Optional[str] = None
    floor_level: Optional[str] = None
    room_number: Optional[str] = None
    phone: str

class OrderCreate(BaseModel):
    shop_id: str
    delivery_address: DeliveryAddressSchema
    payment_method: str  # COD, ONLINE
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    name: str
    price: Decimal
    quantity: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    order_number: str
    student_id: str
    shop_id: str
    shop_name: Optional[str] = None
    status: str
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    tax: Decimal
    total_amount: Decimal
    payment_status: str
    payment_method: str
    delivery_address: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class StudentOrderResponse(OrderResponse):
    """
    Student-facing order response including the 4-digit verification OTP code.
    Delivery partners and shopkeepers receive OrderResponse which strips this field.
    """
    otp: str

class PaymentSessionResponse(BaseModel):
    order_id: str
    order_number: str
    cf_order_id: Optional[str] = None
    payment_session_id: str
    environment: str
    amount: Decimal
    currency: str = "INR"
    qr_data: Optional[str] = None

class PaymentVerificationResponse(BaseModel):
    order_id: str
    payment_status: str  # PAID, PENDING, FAILED
    order_status: str
    transaction_ref: Optional[str] = None
    message: str

