from typing import List, Optional, Any
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.services.admin_metrics_service import AdminMetricsService
from app.services.moderation_service import ModerationService

router = APIRouter()

# --- Metrics Endpoints ---

@router.get("/metrics/users-by-region")
async def get_users_by_region(
    days: int = 30,
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> List[Any]:
    service = AdminMetricsService(db)
    return await service.get_users_by_region(days, region)

@router.get("/metrics/listings-by-region")
async def get_listings_by_region(
    days: int = 30,
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> List[Any]:
    service = AdminMetricsService(db)
    return await service.get_listings_by_region(days, region)

@router.get("/metrics/listings-by-category")
async def get_listings_by_category(
    days: int = 30,
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> List[Any]:
    service = AdminMetricsService(db)
    return await service.get_listings_by_category(days, region)

@router.get("/metrics/activity")
async def get_activity(
    days: int = 30,
    region: Optional[str] = None,
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> List[Any]:
    service = AdminMetricsService(db)
    return await service.get_activity(days, region, city)

@router.get("/metrics/supply-demand")
async def get_supply_demand(
    days: int = 30,
    region: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> List[Any]:
    service = AdminMetricsService(db)
    return await service.get_supply_demand(days, region, category)

# --- Moderation Endpoints ---

@router.post("/moderation/hide-listing")
async def hide_listing(
    listing_id: uuid.UUID = Body(..., embed=True),
    reason: str = Body("", embed=True),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> Any:
    service = ModerationService(db, admin)
    success = await service.hide_listing(listing_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"ok": True}

@router.post("/moderation/ban-user")
async def ban_user(
    user_id: uuid.UUID = Body(..., embed=True),
    reason: str = Body("", embed=True),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> Any:
    service = ModerationService(db, admin)
    success = await service.ban_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

@router.post("/moderation/unban-user")
async def unban_user(
    user_id: uuid.UUID = Body(..., embed=True),
    reason: str = Body("", embed=True),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> Any:
    service = ModerationService(db, admin)
    success = await service.unban_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}
