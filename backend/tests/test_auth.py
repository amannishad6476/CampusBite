import pytest
from fastapi import Depends
from app.main import app
from app.api.deps import RoleChecker
from app.models.models import User

# Add a test route dynamically to app to verify the RoleChecker dependency
@app.get("/api/v1/test-admin-only", tags=["Testing"])
def mock_admin_only_endpoint(user: User = Depends(RoleChecker(["ADMIN"]))):
    return {"message": "Welcome Admin", "email": user.email}

@app.get("/api/v1/test-student-only", tags=["Testing"])
def mock_student_only_endpoint(user: User = Depends(RoleChecker(["STUDENT"]))):
    return {"message": "Welcome Student", "email": user.email}



def test_register_student_success(client, test_location):
    campus_id = test_location["campus_id"]
    payload = {
        "name": "Aman Student",
        "email": "student@bbd.ac.in",
        "phone": "+919876543210",
        "password": "studentpassword",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id,
            "is_hosteler": False
        }
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "student@bbd.ac.in"
    assert data["role"] == "STUDENT"
    assert "password_hash" not in data


def test_register_shopkeeper_success(client):
    payload = {
        "name": "Aman Shopkeeper",
        "email": "shop@bbd.ac.in",
        "phone": "+919876543211",
        "password": "shoppassword",
        "role": "SHOPKEEPER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "shop@bbd.ac.in"
    assert data["role"] == "SHOPKEEPER"


def test_register_delivery_partner_success(client):
    payload = {
        "name": "Aman Delivery",
        "email": "delivery@bbd.ac.in",
        "phone": "+919876543212",
        "password": "deliverypassword",
        "role": "DELIVERY_PARTNER",
        "delivery_details": {
            "vehicle_type": "Bicycle",
            "vehicle_number": "UP32-TEST-1234"
        }
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "delivery@bbd.ac.in"
    assert data["role"] == "DELIVERY_PARTNER"


def test_register_missing_student_details(client):
    payload = {
        "name": "Aman Student Error",
        "email": "student_err@bbd.ac.in",
        "phone": "+919876543213",
        "password": "studentpassword",
        "role": "STUDENT"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "student details" in response.json()["detail"].lower()


def test_register_duplicate_email(client, test_location):
    campus_id = test_location["campus_id"]
    payload1 = {
        "name": "User One",
        "email": "duplicate@bbd.ac.in",
        "phone": "+919876543220",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=payload1)

    payload2 = {
        "name": "User Two",
        "email": "duplicate@bbd.ac.in",
        "phone": "+919876543221",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    response = client.post("/api/v1/auth/register", json=payload2)
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()


def test_register_invalid_email(client):
    payload = {
        "name": "User Bad Email",
        "email": "bademail",
        "phone": "+919876543222",
        "password": "password123",
        "role": "SHOPKEEPER"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client, test_location):
    campus_id = test_location["campus_id"]
    # Register first
    register_payload = {
        "name": "User Login Test",
        "email": "logintest@bbd.ac.in",
        "phone": "+919876543230",
        "password": "correctpassword",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Login
    login_payload = {
        "email": "logintest@bbd.ac.in",
        "password": "correctpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "logintest@bbd.ac.in"


def test_login_invalid_password(client):
    login_payload = {
        "email": "logintest@bbd.ac.in",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


def test_login_nonexistent_email(client):
    login_payload = {
        "email": "nonexistent_user@campusbite.test",
        "password": "Pilot@12345"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 400
    assert "incorrect email or password" in response.json()["detail"].lower()


def test_fresh_registered_pilot_user_login(client, test_location):
    campus_id = test_location["campus_id"]
    # Register fresh pilot student user
    register_payload = {
        "name": "Pilot Student 02",
        "email": "PilotStudent02@CampusBite.test",
        "phone": "+919876543999",
        "password": "Pilot@12345",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    reg_response = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == "pilotstudent02@campusbite.test"

    # Login with exact lowercase email
    res_exact = client.post("/api/v1/auth/login", json={
        "email": "pilotstudent02@campusbite.test",
        "password": "Pilot@12345"
    })
    assert res_exact.status_code == 200
    assert "access_token" in res_exact.json()
    assert res_exact.json()["user"]["email"] == "pilotstudent02@campusbite.test"

    # Login with mixed case email
    res_case = client.post("/api/v1/auth/login", json={
        "email": "PilotStudent02@CampusBite.test",
        "password": "Pilot@12345"
    })
    assert res_case.status_code == 200
    assert "access_token" in res_case.json()

    # Login with whitespace padded email
    res_space = client.post("/api/v1/auth/login", json={
        "email": "  pilotstudent02@campusbite.test  ",
        "password": "Pilot@12345"
    })
    assert res_space.status_code == 200
    assert "access_token" in res_space.json()

    # Login with wrong password rejected
    res_wrong_pw = client.post("/api/v1/auth/login", json={
        "email": "pilotstudent02@campusbite.test",
        "password": "WrongPassword@123"
    })
    assert res_wrong_pw.status_code == 400
    assert "incorrect email or password" in res_wrong_pw.json()["detail"].lower()


def test_read_me_authenticated(client, test_location):
    campus_id = test_location["campus_id"]
    # Register and login
    register_payload = {
        "name": "Me User",
        "email": "me@bbd.ac.in",
        "phone": "+919876543240",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": campus_id
        }
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_response = client.post("/api/v1/auth/login", json={
        "email": "me@bbd.ac.in",
        "password": "password123"
    })
    token = login_response.json()["access_token"]

    # Access /me
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "me@bbd.ac.in"


def test_read_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_role_authorization_enforced(client):
    # Register student
    student_payload = {
        "name": "Role Student",
        "email": "rolestudent@bbd.ac.in",
        "phone": "+919876543250",
        "password": "password123",
        "role": "STUDENT",
        "student_details": {
            "campus_id": 1
        }
    }
    client.post("/api/v1/auth/register", json=student_payload)
    student_login = client.post("/api/v1/auth/login", json={
        "email": "rolestudent@bbd.ac.in",
        "password": "password123"
    }).json()

    # Register admin
    admin_payload = {
        "name": "Role Admin",
        "email": "roleadmin@bbd.ac.in",
        "phone": "+919876543251",
        "password": "password123",
        "role": "ADMIN"
    }
    client.post("/api/v1/auth/register", json=admin_payload)
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "roleadmin@bbd.ac.in",
        "password": "password123"
    }).json()

    # Check student access to admin-only endpoint
    headers_student = {"Authorization": f"Bearer {student_login['access_token']}"}
    response = client.get("/api/v1/test-admin-only", headers=headers_student)
    assert response.status_code == 403

    # Check admin access to admin-only endpoint
    headers_admin = {"Authorization": f"Bearer {admin_login['access_token']}"}
    response = client.get("/api/v1/test-admin-only", headers=headers_admin)
    assert response.status_code == 200
    assert response.json()["email"] == "roleadmin@bbd.ac.in"

    # Check admin access to student-only endpoint (should be forbidden since admin is not in allowed list)
    response_admin_to_student = client.get("/api/v1/test-student-only", headers=headers_admin)
    assert response_admin_to_student.status_code == 403


def test_cors_preflight_production_vercel_origin(client):
    """Verify that OPTIONS preflight requests from Vercel receive valid CORS headers."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://campusbite-web-nine.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://campusbite-web-nine.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallowed_origin_rejected(client):
    """Verify that untrusted origins do NOT receive access-control-allow-origin headers."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://unauthorized-malicious-origin.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_cors_preflight_vercel_preview_subdomain(client):
    """Verify that OPTIONS preflight requests from Vercel preview subdomains receive valid CORS headers."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://campusbite-preview-abc123.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://campusbite-preview-abc123.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


