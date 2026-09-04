from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    phone_number: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_open: Optional[bool] = None
    delivery_available: Optional[bool] = None

class FoodCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class FoodCategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class FoodItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    price: Decimal = Field(..., gt=0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_veg: bool = True
    is_available: bool = True
    category_id: Optional[int] = None
    preparation_time: int = Field(15, ge=1)

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    category_id: Optional[int] = None
    preparation_time: Optional[int] = None

class FoodItemAvailabilityToggle(BaseModel):
    is_available: bool

class OrderPatchStatus(BaseModel):
    status: str = Field(..., description="Target status: ACCEPTED, PREPARING, READY_FOR_PICKUP, CANCELLED")

class EarningSummaryResponse(BaseModel):
    today_earnings: Decimal
    weekly_earnings: Decimal
    monthly_earnings: Decimal
    total_orders: int
    commission_deducted: Decimal
    net_earnings: Decimal

class ShopkeeperProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    shop_id: Optional[str] = None
    shop_name: Optional[str] = None
    campus_id: Optional[int] = None
    campus_name: Optional[str] = None

    class Config:
        from_attributes = True
