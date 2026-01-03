from fastapi import APIRouter, Depends, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import Signup, Login, Token
from app.schemas.user import User
from app.services import auth_service

router = APIRouter()

@router.post("/signup", response_model=Token) # Returns dict with token and user, specific schema implies custom response structure combined
async def signup(signup_data: Signup, db: AsyncSession = Depends(get_db)):
    return await auth_service.signup(db, signup_data)

@router.post("/login", response_model=Token)
async def login(login_data: Login, db: AsyncSession = Depends(get_db)):
    return await auth_service.login(db, login_data)

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh_token(db, refresh_token)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(refresh_token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    await auth_service.logout(db, refresh_token)
