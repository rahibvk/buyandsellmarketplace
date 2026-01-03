import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.listing import Listing
from app.models.listing_image import ListingImage
from app.schemas.listing import ListingImageCreate
from app.services import listing_service

async def create_presigned_url(filename: str, content_type: str) -> dict:
    # MVP Local Storage
    # In production, this would generate an S3 presigned URL
    unique_name = f"{uuid.uuid4()}-{filename}"
    return {
        "upload_url": f"http://localhost:8000/api/v1/media/upload/{unique_name}",
        "file_url": f"http://localhost:8000/static/{unique_name}" 
    }

async def add_image_to_listing(db: AsyncSession, listing_id: uuid.UUID, image_data: ListingImageCreate, user_id: uuid.UUID) -> ListingImage:
    listing = await listing_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if listing.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
        
    new_image = ListingImage(
        listing_id=listing_id,
        url=image_data.url,
        thumb_url=image_data.thumb_url,
        sort_order=image_data.sort_order
    )
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)
    return new_image
