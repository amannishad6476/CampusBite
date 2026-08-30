from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class StudentDetailsSchema(BaseModel):
    campus_id: int
    college_id: Optional[int] = None
    block_id: Optional[int] = None
    hostel_id: Optional[int] = None
    room_number: Optional[str] = None
    floor_level: Optional[str] = None
    is_hosteler: bool = False

class DeliveryDetailsSchema(BaseModel):
    vehicle_type: str
    vehicle_number: Optional[str] = None

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=100)
    role: str  # STUDENT, SHOPKEEPER, DELIVERY_PARTNER, ADMIN
    
    # Optional nested details based on role
    student_details: Optional[StudentDetailsSchema] = None
    delivery_details: Optional[DeliveryDetailsSchema] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = ["STUDENT", "SHOPKEEPER", "DELIVERY_PARTNER", "ADMIN"]
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format")
        return v.lower()

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
