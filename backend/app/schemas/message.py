from datetime import datetime
from typing import Optional
from pydantic import BaseModel, constr
import uuid

class MessageCreate(BaseModel):
    body: constr(min_length=1, max_length=2000)

class Message(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
