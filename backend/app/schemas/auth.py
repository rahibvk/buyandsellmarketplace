from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from app.schemas.user import User

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: User

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class Login(BaseModel):
    email: EmailStr
    password: str

class Signup(BaseModel):
    email: EmailStr
    password: str
    city: Optional[str] = None
    region: Optional[str] = None
