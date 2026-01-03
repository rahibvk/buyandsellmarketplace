import asyncio
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient):
    # 1. Signup
    signup_data = {
        "email": "test@example.com",
        "password": "strongpassword",
        "city": "Berlin",
        "region": "BE"
    }
    response = await client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"
    
    refresh_token = data["refresh_token"]
    
    # 2. Login
    login_data = {
        "email": "test@example.com",
        "password": "strongpassword"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
    # 3. Refresh
    refresh_data = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/refresh", json=refresh_data)
    assert response.status_code == 200
    new_data = response.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    new_refresh = new_data["refresh_token"]
    
    # 4. Logout (using new refresh token)
    logout_data = {"refresh_token": new_refresh}
    response = await client.post("/api/v1/auth/logout", json=logout_data)
    assert response.status_code == 204
    
    # 5. Refresh fail (after logout/rotate)
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_auth_case_insensitive(client: AsyncClient):
    # 1. Signup Mixed Case
    signup_data = {
        "email": "Test@Example.com",
        "password": "pw",
        "city": "Berlin"
    }
    resp = await client.post("/api/v1/auth/signup", json=signup_data)
    assert resp.status_code == 200
    
    # 2. Signup Lowercase Duplicate -> Should Fail
    duplicate_data = {
        "email": "test@example.com",
        "password": "pw",
        "city": "Berlin"
    }
    resp = await client.post("/api/v1/auth/signup", json=duplicate_data)
    assert resp.status_code == 400 # Email already registered
