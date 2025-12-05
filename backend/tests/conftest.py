import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from main import app

# Use in-memory SQLite for tests (fast, isolated)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    yield TestingSessionLocal()

    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI test client with test database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Helper to create authenticated user and return auth headers"""
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User",
        "role": "interviewer"
    }
    response = client.post("/api/auth/signup", json=signup_data)
    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}
