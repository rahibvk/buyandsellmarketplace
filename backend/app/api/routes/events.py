from fastapi import APIRouter, Depends, BackgroundTasks # BackgroundTasks good for events
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import event_service
from app.schemas.event import Event, EventCreate
from app.core.deps import get_optional_current_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=Event)
async def log_event(
    event_data: EventCreate,
    current_user: UserModel | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Events can be anonymous
    user_id = current_user.id if current_user else None
    return await event_service.log_event(db, event_data, user_id)
