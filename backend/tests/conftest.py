import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.models import City, Campus
from app.core.database import get_db
from app.main import app

# In-memory SQLite for isolated, fast unit tests
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before starting tests and drop them afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    """Provide transactional database sessions that rollback after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    """Provide a TestClient with the database dependency overridden to use the test session."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def test_location(db):
    """Pre-populate a test City and Campus for student registration tests."""
    city = db.query(City).filter(City.name == "Test City").first()
    if not city:
        city = City(name="Test City", state="Test State")
        db.add(city)
        db.flush()
    
    campus = db.query(Campus).filter(Campus.name == "Test Campus").first()
    if not campus:
        campus = Campus(name="Test Campus", address="123 Test Road", city_id=city.id)
        db.add(campus)
        db.flush()
    
    db.commit()
    return {"city_id": city.id, "campus_id": campus.id}
