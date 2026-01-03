import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_listings_flow(client: AsyncClient):
    # Setup: Auth
    signup_data = {"email": "seller@example.com", "password": "pw", "city": "London"}
    resp = await client.post("/api/v1/auth/signup", json=signup_data)
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Draft
    listing_data = {
        "title": "Vintage Jacket",
        "description": "Cool jacket",
        "category": "Men",
        "condition": "good",
        "price": 50.0
    }
    response = await client.post("/api/v1/listings/", json=listing_data, headers=headers)
    assert response.status_code == 201
    listing = response.json()
    listing_id = listing["id"]
    assert listing["status"] == "draft"
    
    # 2. Publish
    response = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "live"
    
    # 3. Public View
    # No auth headers
    response = await client.get(f"/api/v1/listings/{listing_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Vintage Jacket"
    
    # 4. Non-owner cannot update
    # New user
    resp2 = await client.post("/api/v1/auth/signup", json={"email": "hacker@example.com", "password": "pw"})
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    update_data = {"price": 1.0}
    response = await client.put(f"/api/v1/listings/{listing_id}", json=update_data, headers=headers2)
    assert response.status_code == 403
    
    # Owner updates
    response = await client.put(f"/api/v1/listings/{listing_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["price"] == 1.0
