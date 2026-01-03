import uuid
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User as UserModel
from app.schemas.listing import ListingImage, ListingImageCreate
from app.services import media_service

router = APIRouter()

@router.post("/presign", response_model=dict)
async def presign_upload(
    filename: str = Body(..., embed=True),
    content_type: str = Body(..., embed=True),
    # db: AsyncSession = Depends(get_db) # Not strictly needed for stub
):
    return await media_service.create_presigned_url(filename, content_type)

@router.put("/upload/{filename}")
async def upload_file(
    filename: str,
    body: bytes = Body(...)
):
    import os
    # Ensure uploads dir exists
    os.makedirs("uploads", exist_ok=True)
    
    file_location = f"uploads/{filename}"
    with open(file_location, "wb") as f:
        f.write(body)
    
    return {"status": "success", "filename": filename} 
