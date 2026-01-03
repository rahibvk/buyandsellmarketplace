import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User as UserModel
from app.schemas.listing import Listing, ListingCreate, ListingUpdate
from app.services import listing_service

router = APIRouter()

@router.post("/", response_model=Listing, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.create_listing(db, listing_data, current_user.id)

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from app.core import security
# ... imports ...
from app.core.deps import get_current_user, get_optional_current_user

# Removed local get_optional_current_user

@router.get("/{id}", response_model=Listing)
async def get_listing(
    id: uuid.UUID,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    listing = await listing_service.get_listing(db, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.status == "live":
        return listing
        
    # If not live, check ownership
    if not current_user or listing.seller_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to view this listing")
    
    return listing

@router.put("/{id}", response_model=Listing)
async def update_listing(
    id: uuid.UUID,
    listing_update: ListingUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.update_listing(db, id, listing_update, current_user.id)

@router.post("/{id}/publish", response_model=Listing)
async def publish_listing(
    id: uuid.UUID,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await listing_service.publish_listing(db, id, current_user.id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    id: uuid.UUID,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await listing_service.delete_listing(db, id, current_user.id)

from app.schemas.listing import ListingImage, ListingImageCreate
from app.services import media_service

@router.post("/{id}/images", response_model=ListingImage)
async def add_image(
    id: uuid.UUID,
    image_data: ListingImageCreate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await media_service.add_image_to_listing(db, id, image_data, current_user.id)
