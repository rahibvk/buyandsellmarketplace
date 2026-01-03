from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import uuid
from .user import User

class ConversationCreate(BaseModel):
    listing_id: uuid.UUID

class ConversationSummary(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    listing_title: str
    other_user: User
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
