import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User as UserModel
from app.models.favorite import Favorite
from app.schemas.favorite import Favorite as FavoriteSchema
from app.models.listing import Listing

router = APIRouter()

@router.post("/{listing_id}", response_model=FavoriteSchema, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    listing_id: uuid.UUID,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if listing exists
    listing = await db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check already favorite
    query = select(Favorite).where(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id)
    existing = await db.execute(query)
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already favorited")

    new_fav = Favorite(user_id=current_user.id, listing_id=listing_id)
    db.add(new_fav)
    await db.commit()
    return new_fav

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite(
    listing_id: uuid.UUID,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Favorite).where(Favorite.user_id == current_user.id, Favorite.listing_id == listing_id)
    result = await db.execute(query)
    fav = result.scalars().first()
    
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
        
    await db.delete(fav)
    await db.commit()

@router.get("/", response_model=List[FavoriteSchema])
async def get_favorites(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Favorite).where(Favorite.user_id == current_user.id).options(selectinload(Favorite.listing).selectinload(Listing.images))
    result = await db.execute(query)
    return result.scalars().all()
