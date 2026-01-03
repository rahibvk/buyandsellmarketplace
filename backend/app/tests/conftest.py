import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
# Import models to register with Base
from app.models.user import User
from app.models.listing import Listing
from app.models.refresh_token import RefreshToken
from app.models.listing_image import ListingImage
from app.models.favorite import Favorite
from app.models.event import Event

# ... imports ...

# Remove global engine/session
# engine = create_async_engine(settings.DATABASE_URL)
# TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@pytest_asyncio.fixture(scope="function")
async def db_engine():
    # Create engine per function to avoid loop binding issues
    engine = create_async_engine(settings.DATABASE_URL, poolclass=None) # poolclass=None (NullPool) is safer for tests but standard pool ok if disposed
    
    # Setup tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    # Teardown
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db(db_engine) -> AsyncGenerator[AsyncSession, None]:
    # Create session factory bound to the function-scoped engine
    async_session_factory = async_sessionmaker(db_engine, expire_on_commit=True)
    async with async_session_factory() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def client(db) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
