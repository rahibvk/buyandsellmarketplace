import asyncio
import httpx

async def test_auth():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        # 1. Signup
        email = "debug_user@example.com"
        password = "password123"
        
        print(f"Attempting signup for {email}...")
        signup_payload = {"email": email, "password": password}
        resp = await client.post("/auth/signup", json=signup_payload)
        
        if resp.status_code == 200:
            print("Signup success")
        elif resp.status_code == 400 and "already exists" in resp.text:
            print("User already exists, proceeding to login")
        else:
            print(f"Signup failed: {resp.status_code} {resp.text}")
            return

        # 2. Login
        print("Attempting login...")
        login_payload = {"email": email, "password": password}
        resp = await client.post("/auth/login", json=login_payload)
        
        if resp.status_code == 200:
            print("Login success!")
            print(f"Token: {resp.json().get('access_token')[:10]}...")
        else:
            print(f"Login failed: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_auth())
