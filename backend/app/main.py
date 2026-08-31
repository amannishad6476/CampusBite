from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.api.routes import auth, locations, student_ops, shopkeeper_ops

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="CampusBite REST API gateway connecting Students, Shopkeepers, Delivery Partners, and Admins."
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    # Handle wildcard vs specific hosts
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True if "*" not in origins else False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Global Exception Handlers

@app.exception_handler(SQLAlchemyError)
def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Global handler for intercepting database transaction/integrity errors."""
    # Note: Real systems should log this exception securely.
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

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API Gateway"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "api_version": settings.API_V1_STR
    }
