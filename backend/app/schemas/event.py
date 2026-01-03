from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
import uuid

class EventCreate(BaseModel):
    event_type: str
    listing_id: Optional[uuid.UUID] = None
    metadata: Dict[str, Any] = {}

class Event(EventCreate):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
    region: Optional[str] = None
    city: Optional[str] = None

    class Config:
        from_attributes = True
