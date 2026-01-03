from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import Signup, Login, Token
from app.core import security
from app.core.config import settings

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def signup(db: AsyncSession, signup_data: Signup) -> dict:
    email = signup_data.email.lower()
    user = await get_user_by_email(db, email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    new_user = User(
        email=email,
        password_hash=security.get_password_hash(signup_data.password),
        city=signup_data.city,
        region=signup_data.region,
        role="user"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return await create_tokens(db, new_user)

async def login(db: AsyncSession, login_data: Login) -> dict:
    email = login_data.email.lower()
    user = await get_user_by_email(db, email)
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return await create_tokens(db, user)

async def create_tokens(db: AsyncSession, user: User) -> dict:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    refresh_token_str = security.create_access_token(
        subject=user.id, expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Store refresh token in DB
    refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=security.get_password_hash(refresh_token_str), # Store hashed
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token)
    await db.commit()
    await db.refresh(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_str, # Return plain token to user once
        "user": user
    }

async def refresh_token(db: AsyncSession, token: str) -> dict:
    try:
        payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except security.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # Verify token exists and is valid in DB (we can't verify hash easily without scanning or specific stored ID, 
    # but for this MVP we usually send refresh token + maybe an ID if we wanted strictness. 
    # The requirement says "Store refresh tokens hashed in DB". 
    # Validating a hashed token solely from the input token string is hard if we don't know WHICH record it is.
    # Standard practice with hashed tokens: Client sends (RefreshTokenString). 
    # We decode it, get 'sub' (User ID). Then we check the user's active refresh tokens.
    # We verify if the incoming token matches any of the stored hashes for that user.
    
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == uuid.UUID(str(user_id))))
    user_tokens = result.scalars().all()
    
    valid_token_record = None
    for rt in user_tokens:
        if security.verify_password(token, rt.token_hash):
            if rt.expires_at > datetime.now(timezone.utc):
                valid_token_record = rt
                break
    
    if not valid_token_record:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Rotate token: connect old one (delete) and create new
    await db.delete(valid_token_record)
    user = await db.get(User, uuid.UUID(str(user_id))) # fetch user
    
    return await create_tokens(db, user)

async def logout(db: AsyncSession, token: str):
    try:
        payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except security.JWTError:
        return 
        
    if user_id:
         result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == uuid.UUID(str(user_id))))
         user_tokens = result.scalars().all()
         
         for rt in user_tokens:
             if security.verify_password(token, rt.token_hash):
                 await db.delete(rt)
                 break
             
         await db.commit()
