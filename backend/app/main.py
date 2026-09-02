import logging
from fastapi import FastAPI, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.database import get_db
from app.api.routes import auth, locations, student_ops, shopkeeper_ops, delivery_ops, admin_ops

logger = logging.getLogger("campusbite.main")

tags_metadata = [
    {
        "name": "Authentication",
        "description": "User authentication, registration, JWT token generation, and profile management.",
    },
    {
        "name": "Locations",
        "description": "Hierarchical campus location discovery (Campuses, Colleges, Blocks, Hostels).",
    },
    {
        "name": "Student Operations",
        "description": "Student food ordering, canteen menu browsing, and OTP-secured order tracking.",
    },
    {
        "name": "Shopkeeper Operations",
        "description": "Canteen management, menu catalog CRUD, order lifecycle transitions, and revenue summaries.",
    },
    {
        "name": "Delivery Partner Operations",
        "description": "Delivery fleet operations, order claiming, pickup & transit progression, OTP delivery verification, and rider earnings.",
    },
    {
        "name": "Admin Operations",
        "description": "Administrative control center, campus hierarchy management, vendor approvals/suspensions, order overrides, and audit trails.",
    },
    {
        "name": "System Health",
        "description": "Liveness probes, service status, and database connectivity checks.",
    },
]

app = FastAPI(
    title="CampusBite API",
    description="CampusBite REST API gateway connecting Students, Shopkeepers, Delivery Partners, and Admins across campus colleges.",
    version=settings.VERSION,
    openapi_tags=tags_metadata,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "CampusBite Support",
        "url": "https://campusbite.com",
        "email": "support@campusbite.com",
    },
)

# Set all CORS enabled origins
origins = [str(origin).strip().strip('"').strip("'").rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS if str(origin).strip()]
if "https://campusbite-web-nine.vercel.app" not in origins:
    origins.append("https://campusbite-web-nine.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/campusbite([a-zA-Z0-9\-_]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)




# Global Exception Handlers

@app.exception_handler(SQLAlchemyError)
def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Global handler for intercepting database transaction/integrity errors."""
    logger.error(f"Global SQLAlchemyError on {request.method} {request.url.path}: {exc.__class__.__name__}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database connection or transaction failure. Action aborted."}
    )

@app.exception_handler(RequestValidationError)

def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Global handler for capturing input validation issues."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Input validation error",
            "errors": jsonable_encoder(exc.errors())
        }
    )

# Register API Routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)

app.include_router(
    locations.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Locations"]
)

app.include_router(
    student_ops.router,
    prefix=f"{settings.API_V1_STR}/students",
    tags=["Student Operations"]
)

app.include_router(
    shopkeeper_ops.router,
    prefix=f"{settings.API_V1_STR}/shopkeepers",
    tags=["Shopkeeper Operations"]
)

app.include_router(
    delivery_ops.router,
    prefix=f"{settings.API_V1_STR}/delivery",
    tags=["Delivery Partner Operations"]
)

app.include_router(
    admin_ops.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["Admin Operations"]
)

@app.get("/", tags=["System Health"])
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API Gateway"}

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "api_version": settings.API_V1_STR
    }

@app.get("/health/db", tags=["System Health"])
def health_db_check(db: Session = Depends(get_db)):
    """Verifies database connectivity without exposing connection secrets."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "service": settings.PROJECT_NAME
        }
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected"}
        )
