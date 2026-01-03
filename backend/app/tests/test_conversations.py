import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_conversations_flow(client: AsyncClient):
    # 1. Create Seller
    resp = await client.post("/api/v1/auth/signup", json={"email": "seller@test.com", "password": "pass"})
    seller_token = resp.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    
    # 2. Create Listing and Publish
    l_resp = await client.post("/api/v1/listings/", json={
        "title": "Item 1", 
        "category": "Cat", 
        "condition": "new", 
        "price": 100
    }, headers=seller_headers)
    assert l_resp.status_code == 201
    listing_id = l_resp.json()["id"]
    
    # Publish
    p_resp = await client.post(f"/api/v1/listings/{listing_id}/publish", headers=seller_headers)
    assert p_resp.status_code == 200
    
    # 3. Create Buyer
    resp = await client.post("/api/v1/auth/signup", json={"email": "buyer@test.com", "password": "pass"})
    buyer_token = resp.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # 4. Buyer creates conversation
    c_resp = await client.post("/api/v1/conversations/", json={"listing_id": listing_id}, headers=buyer_headers)
    assert c_resp.status_code == 200
    data = c_resp.json()
    conv_id = data["id"]
    assert data["listing_id"] == listing_id
    assert data["unread_count"] == 0
    
    # 5. Duplicate create returns same
    c_resp2 = await client.post("/api/v1/conversations/", json={"listing_id": listing_id}, headers=buyer_headers)
    assert c_resp2.status_code == 200
    assert c_resp2.json()["id"] == conv_id
    
    # 6. Seller List Conversations
    list_resp = await client.get("/api/v1/conversations/", headers=seller_headers)
    assert list_resp.status_code == 200
    conversations = list_resp.json()
    assert len(conversations) == 1
    assert conversations[0]["id"] == conv_id
    # Check other_user for seller is buyer
    # Note: user response might vary but email should be buyer@test.com if included or checking ID
    # Our schema usually returns User object.
    
    # 7. Buyer sends message
    m_resp = await client.post(f"/api/v1/conversations/{conv_id}/messages", json={"body": "Hello"}, headers=buyer_headers)
    assert m_resp.status_code == 200
    
    # 8. Seller checks messages
    msgs_resp = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=seller_headers)
    assert msgs_resp.status_code == 200
    messages = msgs_resp.json()
    assert len(messages) == 1
    assert messages[0]["body"] == "Hello"
    
    # 9. Verify unread count for seller
    list_resp_s = await client.get("/api/v1/conversations/", headers=seller_headers)
    assert list_resp_s.json()[0]["unread_count"] == 1
    
    # 10. Seller marks read
    read_resp = await client.post(f"/api/v1/conversations/{conv_id}/read", headers=seller_headers)
    assert read_resp.status_code == 200
    
    list_resp_s2 = await client.get("/api/v1/conversations/", headers=seller_headers)
    assert list_resp_s2.json()[0]["unread_count"] == 0
    
    # 11. Random user access denied
    resp = await client.post("/api/v1/auth/signup", json={"email": "random@test.com", "password": "pass"})
    rand_headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
    
    fail_resp = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=rand_headers)
    assert fail_resp.status_code == 403
