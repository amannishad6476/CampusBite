import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("campusbite.database")

# Detect SQLite vs PostgreSQL database engine
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    # Production PostgreSQL / Neon Serverless configuration
    # 1. pool_pre_ping=True: Health-checks stale/dropped connections before query execution
    # 2. pool_recycle=300: Discards connections after 5 minutes before Neon idle-kill thresholds
    # 3. pool_size=10, max_overflow=20: Manages concurrency safely within Neon tier limits
    # 4. pool_timeout=30: Time in seconds to wait before timing out when getting a connection from pool
    # 5. connect_args: Enforces TCP keepalives to prevent cloud load-balancers & firewalls from dropping idle sockets
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    )

# Database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# DB dependency for FastAPI endpoints with automatic rollback on unhandled exceptions
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        logger.error(f"Database session encountered an unhandled exception: {exc}")
        db.rollback()
        raise
    finally:
        db.close()

