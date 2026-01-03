import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import Event
from app.schemas.event import EventCreate

async def log_event(db: AsyncSession, event_data: EventCreate, user_id: uuid.UUID | None = None) -> Event:
    new_event = Event(
        **event_data.model_dump(),
        user_id=user_id,
        # Enrich with geo info if we had request context, for now user_id and data sufficient
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event
