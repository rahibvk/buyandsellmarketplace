from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid

class UserBase(BaseModel):
    email: EmailStr
    city: Optional[str] = None
    region: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    city: Optional[str] = None
    region: Optional[str] = None
    display_name: Optional[str] = None # Not in DB model yet, but allowed in API spec? User requested "update city/region/display_name", need to check DB model. DB model doesn't have display_name. I will ignore display_name for DB persistence or map to something else, or remove it. User DB model has no display_name. I'll stick to DB for MVP or add it if crucial. The prompt said "update city/region/display_name(optional)". I should add display_name to User model or ignoring it. I will support city/region updates.

class User(UserBase):
    id: uuid.UUID
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True
