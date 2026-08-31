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
