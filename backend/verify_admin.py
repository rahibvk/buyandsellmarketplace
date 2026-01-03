import asyncio
import sys
import os

# Set path to allow imports
sys.path.append('/app/backend')

from app.core.database import SessionLocal
from app.models.user import User
from sqlalchemy import select
from app.core.security import verify_password
from app.core.config import settings

async def verify_admin():
    async with SessionLocal() as db:
        print("Checking for admin user...")
        result = await db.execute(select(User).where(User.email == 'admin@example.com'))
        user = result.scalars().first()
        
        if not user:
            print("ERROR: Admin user 'admin@example.com' NOT FOUND.")
            return

        print(f"User Found: ID={user.id}")
        print(f"Role: {user.role}")
        print(f"Is Banned: {user.is_banned}")
        print(f"Password Hash: {user.password_hash}")
        
        # Verify password
        is_valid = verify_password("password", user.password_hash)
        print(f"Password 'password' valid: {is_valid}")
        
        if not is_valid:
             print("ERROR: Password mismatch.")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(verify_admin())
