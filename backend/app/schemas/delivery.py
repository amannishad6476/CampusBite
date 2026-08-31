from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class DeliveryPartnerProfile(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    vehicle_type: str
    vehicle_number: Optional[str] = None
    rating: Decimal
    is_active: bool
    status: str  # ONLINE, OFFLINE, BUSY (computed dynamically)

    class Config:
        from_attributes = True

class AvailabilityUpdate(BaseModel):
    is_active: bool

class VerifyOtpPayload(BaseModel):
    otp: str = Field(..., min_length=4, max_length=6)

class DeliveryResponse(BaseModel):
    id: str
    order_id: str
    delivery_partner_id: str
    status: str
    picked_up_at: Optional[str] = None
    delivered_at: Optional[str] = None
    otp_verified: bool

    class Config:
        from_attributes = True

class DeliveryEarningSummary(BaseModel):
    today_earnings: Decimal
    weekly_earnings: Decimal
    monthly_earnings: Decimal
    total_deliveries: int
    delivery_fee_earned: Decimal
    net_earnings: Decimal
