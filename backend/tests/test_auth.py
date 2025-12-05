import pytest

def test_signup_success(client):
    """Test successful user signup"""
    response = client.post("/api/auth/signup", json={
        "email": "newuser@example.com",
        "password": "password123",
        "name": "New User",
        "role": "candidate"
    })

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "candidate"

def test_signup_duplicate_email(client):
    """Test signup with existing email fails"""
    client.post("/api/auth/signup", json={
        "email": "duplicate@example.com",
        "password": "password123",
        "name": "First User",
        "role": "interviewer"
    })

    response = client.post("/api/auth/signup", json={
        "email": "duplicate@example.com",
        "password": "different123",
        "name": "Second User",
        "role": "candidate"
    })

    assert response.status_code == 400

def test_login_success(client):
    """Test successful login"""
    client.post("/api/auth/signup", json={
        "email": "login@example.com",
        "password": "password123",
        "name": "Login User",
        "role": "interviewer"
    })

    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_current_user(client, auth_headers):
    """Test getting current authenticated user"""
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
