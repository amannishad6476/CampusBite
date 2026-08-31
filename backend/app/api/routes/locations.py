from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Campus, College, Block, Hostel
from app.schemas.location import CampusResponse, CollegeResponse, BlockResponse, HostelResponse

router = APIRouter()

@router.get("/campuses", response_model=List[CampusResponse])
def get_campuses(city_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieve all active campuses, optionally filtered by city."""
    query = db.query(Campus).filter(Campus.is_active == True)
    if city_id is not None:
        query = query.filter(Campus.city_id == city_id)
    return query.all()

@router.get("/colleges", response_model=List[CollegeResponse])
def get_colleges(campus_id: int, db: Session = Depends(get_db)):
    """Retrieve colleges associated with a specific campus."""
    return db.query(College).filter(College.campus_id == campus_id).all()

@router.get("/blocks", response_model=List[BlockResponse])
def get_blocks(campus_id: int, college_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieve academic blocks/buildings, optionally filtered by college."""
    query = db.query(Block).filter(Block.campus_id == campus_id)
    if college_id is not None:
        query = query.filter(Block.college_id == college_id)
    return query.all()

@router.get("/hostels", response_model=List[HostelResponse])
def get_hostels(campus_id: int, db: Session = Depends(get_db)):
    """Retrieve hostels associated with a specific campus."""
    return db.query(Hostel).filter(Hostel.campus_id == campus_id).all()
