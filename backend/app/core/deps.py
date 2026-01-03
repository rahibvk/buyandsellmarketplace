from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
import uuid

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = payload
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user_id = token_data.get("sub")
    if user_id is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    result = await db.execute(select(User).where(User.id == uuid.UUID(str(user_id))))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(default=None) 
) -> User | None:
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except (JWTError, ValidationError, ValueError):
        return None
        
    result = await db.execute(select(User).where(User.id == uuid.UUID(str(user_id))))
    return result.scalars().first()

async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    if current_user.is_banned:
        raise HTTPException(
             status_code=status.HTTP_403_FORBIDDEN, detail="User is banned"
        )
    return current_user
