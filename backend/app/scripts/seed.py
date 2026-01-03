import asyncio
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.user import User
from app.models.listing import Listing
from app.models.refresh_token import RefreshToken
from app.models.listing_image import ListingImage
from app.models.favorite import Favorite
from app.models.event import Event
from app.core.security import get_password_hash

async def seed():
    print("Seeding database...")
    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with SessionLocal() as db:
        # Create Listing
        # 1. Create Users
        users = []
        for i in range(5):
            email = f"user{i}@example.com"
            user = User(
                email=email,
                password_hash=get_password_hash("password"),
                city=random.choice(["Berlin", "London", "Paris", "New York"]),
                region="EU"
            )
            db.add(user)
            users.append(user)
        
        # Create Admin
        admin_user = User(
            email="admin@example.com",
            password_hash=get_password_hash("password"),
            city="Admin City",
            region="Global",
            role="admin"
        )
        db.add(admin_user)
        
        await db.commit()
        for u in users: await db.refresh(u)
        
        # 2. Create Listings
        categories = ["Men", "Women", "Kids", "Home"]
        conditions = ["new", "like_new", "good", "fair"]
        brands = ["Nike", "Adidas", "Zara", "H&M"]
        
        listings = []
        for i in range(20):
            seller = random.choice(users)
            title = f"{random.choice(brands)} Item {i}"
            listing = Listing(
                seller_id=seller.id,
                title=title,
                description=f"A great {title} in {random.choice(conditions)} condition.",
                category=random.choice(categories),
                brand=title.split()[0],
                condition=random.choice(conditions),
                price=random.uniform(10.0, 200.0),
                status="live", # Make them live
                currency="EUR"
            )
            db.add(listing)
        
        await db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
