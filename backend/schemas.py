from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class APIKeyCreate(BaseModel):
    name: str

class APIKeyResponse(BaseModel):
    id: int
    key: str
    name: str
    daily_limit: int
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime]
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None

class PlanCreate(BaseModel):
    name: str
    description: str
    price: float
    daily_requests: int
    stripe_price_id: str

class PlanResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    daily_requests: int
    is_active: bool
    
    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    plan_id: int

class UserLimitUpdate(BaseModel):
    daily_limit: int
