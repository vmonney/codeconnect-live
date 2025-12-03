from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.user import UserResponse


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
