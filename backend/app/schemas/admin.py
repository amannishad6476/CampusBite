from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class DashboardSummary(BaseModel):
    total_students: int
    total_shopkeepers: int
    total_delivery_partners: int
    total_shops: int
    active_shops: int
    today_orders: int
    completed_orders: int
    cancelled_orders: int
    today_gmv: Decimal
    platform_commission: Decimal
    delivery_fees: Decimal
    net_platform_earnings: Decimal

class StatusUpdatePayload(BaseModel):
    status: str = Field(..., description="Target status (e.g. APPROVED, SUSPENDED, ACTIVE, INACTIVE)")
    reason: Optional[str] = Field(None, description="Optional reason for status adjustment")

class UserStatusUpdatePayload(BaseModel):
    is_active: bool
    reason: Optional[str] = Field(None, description="Optional reason for status adjustment")

class OrderOverridePayload(BaseModel):
    status: str = Field(..., description="Target order status")
    reason: str = Field(..., min_length=5, description="Mandatory reason for admin override")

class AuditLogResponse(BaseModel):
    id: str
    admin_id: str
    admin_name: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    reason: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class CampusCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CollegeCreate(BaseModel):
    name: str
    campus_id: int

class BlockCreate(BaseModel):
    name: str
    campus_id: int

class HostelCreate(BaseModel):
    name: str
    campus_id: int

class ShopkeeperCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str = Field(..., min_length=6)

class DeliveryPartnerCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str = Field(..., min_length=6)
    vehicle_type: str = "BIKE"
    vehicle_number: Optional[str] = None

class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = None
    shopkeeper_id: str
    campus_id: int
    phone_number: Optional[str] = None
    opening_time: Optional[str] = "08:00 AM"
    closing_time: Optional[str] = "10:00 PM"
    delivery_available: bool = True

class ShopUpdateAdmin(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    shopkeeper_id: Optional[str] = None
    campus_id: Optional[int] = None
    phone_number: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    delivery_available: Optional[bool] = None
    is_open: Optional[bool] = None
    status: Optional[str] = None

class FoodItemCreateAdmin(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    category_id: Optional[int] = None
    is_veg: bool = True
    preparation_time: int = 15
    is_available: bool = True
    image_url: Optional[str] = None

class FoodItemUpdateAdmin(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    category_id: Optional[int] = None
    is_veg: Optional[bool] = None
    preparation_time: Optional[int] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None

class OrderAssignRiderPayload(BaseModel):
    delivery_partner_id: str

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    order_number: Optional[str] = None
    amount: Decimal
    status: str
    gateway: str
    transaction_ref: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None
    shop_name: Optional[str] = None

