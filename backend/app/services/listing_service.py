import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.listing import Listing
from app.models.listing_image import ListingImage
from app.schemas.listing import ListingCreate, ListingUpdate, ListingImageCreate
from app.models.user import User

async def create_listing(db: AsyncSession, listing_data: ListingCreate, user_id: uuid.UUID) -> Listing:
    new_listing = Listing(
        **listing_data.model_dump(),
        seller_id=user_id,
        status="draft"
    )
    db.add(new_listing)
    await db.commit()
    await db.refresh(new_listing, attribute_names=["images", "seller"])
    return new_listing

async def get_listing(db: AsyncSession, listing_id: uuid.UUID) -> Listing | None:
    # Eager load images and seller for response
    query = select(Listing).where(Listing.id == listing_id).options(selectinload(Listing.images), selectinload(Listing.seller))
    result = await db.execute(query)
    return result.scalars().first()

async def update_listing(db: AsyncSession, listing_id: uuid.UUID, listing_update: ListingUpdate, user_id: uuid.UUID) -> Listing:
    listing = await get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
        
    if listing.status not in ["draft", "live"]:
         raise HTTPException(status_code=400, detail="Cannot edit sold or hidden listings")

    update_data = listing_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)
        
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing

async def publish_listing(db: AsyncSession, listing_id: uuid.UUID, user_id: uuid.UUID) -> Listing:
    listing = await get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to publish this listing")

    listing.status = "live"
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing

async def delete_listing(db: AsyncSession, listing_id: uuid.UUID, user_id: uuid.UUID):
    listing = await get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    # Soft delete
    listing.status = "hidden"
    db.add(listing)
    await db.commit()
