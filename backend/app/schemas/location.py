from pydantic import BaseModel
from typing import Optional

class CampusResponse(BaseModel):
    id: int
    name: str
    address: str
    city_id: int
    is_active: bool = True

    class Config:
        from_attributes = True

class CollegeResponse(BaseModel):
    id: int
    name: str
    campus_id: int

    class Config:
        from_attributes = True

class BlockResponse(BaseModel):
    id: int
    name: str
    college_id: Optional[int] = None
    campus_id: int

    class Config:
        from_attributes = True

class HostelResponse(BaseModel):
    id: int
    name: str
    campus_id: int

    class Config:
        from_attributes = True
