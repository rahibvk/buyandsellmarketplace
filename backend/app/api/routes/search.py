from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.listing import Listing
from app.schemas.common import PaginatedResponse
from app.services import search_service

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[Listing])
async def search_listings(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    condition: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await search_service.search_listings(
        db, q, category, min_price, max_price, brand, condition, page, page_size
    )
