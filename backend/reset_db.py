import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.core.database import Base

async def reset_db():
    print(f"Connecting to {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Dropping all tables...")
        # Reflecting and dropping is cleaner if Base metadata is complete, 
        # but pure SQL is safer if metadata is out of sync.
        # We will use cascade drop public schema to be sure.
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        print("Schema reset complete.")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_db())
