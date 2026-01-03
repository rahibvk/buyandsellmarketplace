from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import uuid
from app.schemas.listing import Listing

class Favorite(BaseModel):
    user_id: uuid.UUID
    listing_id: uuid.UUID
    created_at: datetime
    listing: Optional[Listing] = None

    class Config:
        from_attributes = True
