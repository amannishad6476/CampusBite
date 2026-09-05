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


class LocationUpdatePayload(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class DeliveryPartnerProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None


class UnassignPayload(BaseModel):
    reason: Optional[str] = "Rider unassigned order before pickup"


class EarningHistoryItem(BaseModel):
    id: str
    order_id: Optional[str] = None
    order_number: Optional[str] = None
    shop_name: Optional[str] = None
    amount: Decimal
    type: str
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class EarningHistoryResponse(BaseModel):
    total_records: int
    items: list[EarningHistoryItem]

