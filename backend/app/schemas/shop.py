from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class ShopResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    rating: Decimal
    is_open: bool
    campus_id: int
    phone_number: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    delivery_available: bool = True
    status: str = "APPROVED"

    class Config:
        from_attributes = True

class FoodCategoryResponse(BaseModel):
    id: int
    name: str
    shop_id: str

    class Config:
        from_attributes = True

class FoodItemResponse(BaseModel):
    id: str
    name: str
    price: Decimal
    image_url: Optional[str] = None
    is_veg: bool
    is_available: bool
    category_id: int
    shop_id: str
    description: Optional[str] = None
    preparation_time: int = 15

    class Config:
        from_attributes = True
