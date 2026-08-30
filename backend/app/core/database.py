from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database engine
# pool_pre_ping checks connection liveness before executing queries
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# DB dependency for endpoints and operations
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
