import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user
from app.models.models import User, Student, Shopkeeper, DeliveryPartner
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

logger = logging.getLogger("campusbite.auth")
router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user with standard details and role-specific records."""
    email_clean = user_in.email.strip().lower()
    phone_clean = user_in.phone.strip()

    try:
        # Check for duplicate email
        email_check = db.query(User).filter(func.lower(User.email) == email_clean).first()
        if email_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        
        # Check for duplicate phone
        phone_check = db.query(User).filter(User.phone == phone_clean).first()
        if phone_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )

        # Base user object
        db_user = User(
            name=user_in.name.strip(),
            email=email_clean,
            phone=phone_clean,
            password_hash=get_password_hash(user_in.password),
            role=user_in.role
        )
        db.add(db_user)
        db.flush()  # Generates the base User UUID

        # Build associated role record
        if user_in.role == "STUDENT":
            if not user_in.student_details:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student details (campus_id, is_hosteler, etc.) are required for STUDENT registration."
                )
            
            student_record = Student(
                user_id=db_user.id,
                campus_id=user_in.student_details.campus_id,
                college_id=user_in.student_details.college_id,
                block_id=user_in.student_details.block_id,
                hostel_id=user_in.student_details.hostel_id,
                room_number=user_in.student_details.room_number,
                floor_level=user_in.student_details.floor_level,
                is_hosteler=user_in.student_details.is_hosteler
            )
            db.add(student_record)

        elif user_in.role == "DELIVERY_PARTNER":
            if not user_in.delivery_details:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivery details (vehicle_type) are required for DELIVERY_PARTNER registration."
                )
            
            delivery_record = DeliveryPartner(
                user_id=db_user.id,
                vehicle_type=user_in.delivery_details.vehicle_type,
                vehicle_number=user_in.delivery_details.vehicle_number
            )
            db.add(delivery_record)

        elif user_in.role == "SHOPKEEPER":
            shopkeeper_record = Shopkeeper(
                user_id=db_user.id,
                is_verified=False
            )
            db.add(shopkeeper_record)

        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error(f"Database error during registration for {email_clean}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during registration. Action aborted."
        )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate email and password, returning JWT access token."""
    email_clean = login_in.email.strip().lower()
    try:
        user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error(f"Database error during login query for {email_clean}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error during authentication. Please retry."
        )

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    """Retrieve details for the currently authenticated user."""
    return current_user

