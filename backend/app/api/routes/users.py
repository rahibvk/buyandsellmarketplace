from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User as UserModel
from app.schemas.user import User, UserUpdate

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: UserModel = Depends(get_current_user),
):
    return current_user

@router.patch("/me", response_model=User)
async def update_user_me(
    update_data: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if update_data.city is not None:
        current_user.city = update_data.city
    if update_data.region is not None:
        current_user.region = update_data.region
    # Ignore display_name for now as it's not in the model per previous thought
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
