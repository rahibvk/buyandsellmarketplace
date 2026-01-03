from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid
from app.schemas.user import User

class ListingImageBase(BaseModel):
    url: str
    thumb_url: Optional[str] = None
    sort_order: int = 0

class ListingImageCreate(ListingImageBase):
    pass

class ListingImage(ListingImageBase):
    id: uuid.UUID
    listing_id: uuid.UUID

    class Config:
        from_attributes = True

class ListingBase(BaseModel):
    title: str
    description: str = ""
    category: str
    brand: Optional[str] = None
    size: Optional[str] = None
    condition: str
    price: float
    currency: str = "EUR"

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None

class Listing(ListingBase):
    id: uuid.UUID
    seller_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
    images: List[ListingImage] = []
    seller: Optional[User] = None 

    class Config:
        from_attributes = True
