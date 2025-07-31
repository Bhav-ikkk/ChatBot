# main.py
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import redis
import os
from contextlib import asynccontextmanager
from typing import List

# Load environment variables first, this is a crucial step
from dotenv import load_dotenv
load_dotenv()

# Now import local modules
from database import get_db, engine, Base
from models import User, APIKey, Subscription, ChatLog, Plan
from schemas import *
from auth import create_access_token, get_current_user
from rate_limiter import RateLimiter
from ollama_client import OllamaClient
from huggingface_client import HuggingFaceClient
from stripe_client import StripeClient
from gemini_client import GeminiClient
import hashlib
import uuid

# This line will now work correctly because Base is defined in database.py
# and all models in models.py inherit from it, registering themselves.
Base.metadata.create_all(bind=engine)

# --- Client and App Initialization ---

redis_url = os.getenv("REDIS_URL")
redis_client = None
if redis_url:
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"WARNING: Could not initialize Redis client: {e}")

# Initialize other clients, reading from .env
ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
ollama_client = OllamaClient(base_url=ollama_url)
hf_client = HuggingFaceClient()
stripe_client = StripeClient()
gemini_client = GeminiClient()

# Ensure redis_client is available before creating RateLimiter
if redis_client:
    rate_limiter = RateLimiter(redis_client)
else:
    # If Redis is down, create a dummy rate limiter that always allows requests
    # This prevents the app from crashing but should be logged.
    print("WARNING: Redis not connected. Rate limiting is disabled.")
    class DummyRateLimiter:
        async def check_rate_limit(self, *args, **kwargs):
            return True
    rate_limiter = DummyRateLimiter()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting AI Chatbot API...")
    if redis_client:
        try:
            # FIX: Removed 'await' because redis-py's ping is synchronous
            if redis_client.ping():
                print("Successfully connected to Redis.")
        except Exception as e:
            print(f"Could not connect to Redis during startup check: {e}")
    yield
    print("Shutting down...")

app = FastAPI(
    title="AI Chatbot API",
    description="Scalable AI Chatbot with Ollama and HuggingFace",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS from .env
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routes ---

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    api_key = APIKey(
        user_id=new_user.id,
        key=f"ak_{uuid.uuid4().hex}",
        name="Default Key",
    )
    db.add(api_key)
    db.commit()
    
    return new_user

@app.post("/api/auth/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or user.password_hash != hashlib.sha256(credentials.password.encode()).hexdigest():
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account deactivated")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Fetch the currently authenticated user.
    """
    return current_user

@app.get("/api/keys", response_model=List[APIKeyResponse])
async def get_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(APIKey).filter(APIKey.user_id == current_user.id).all()

@app.post("/api/keys", response_model=APIKeyResponse)
async def create_api_key(key_data: APIKeyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = APIKey(user_id=current_user.id, key=f"ak_{uuid.uuid4().hex}", name=key_data.name)
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key

@app.delete("/api/keys/{key_id}")
async def delete_api_key(key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(api_key)
    db.commit()
    return {"message": "API key deleted"}

@app.post("/api/chat")
async def chat(
    fastapi_request: Request, # Renamed to avoid conflict with our own request object
    fastapi_response: Response,
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    api_key = fastapi_request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    key_obj = db.query(APIKey).filter(APIKey.key == api_key, APIKey.is_active == True).first()
    if not key_obj:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # FIX: Use the new rate limiter which returns remaining requests
    is_allowed, remaining_requests = await rate_limiter.check_rate_limit(
        api_key, key_obj.daily_limit, fastapi_request.client.host
    )
    
    # Add the remaining count to the response headers
    fastapi_response.headers["X-RateLimit-Remaining"] = str(remaining_requests)
    
    if not is_allowed:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Try again tomorrow.")
    
    response_text = None
    model_used = "unknown"
    
    # FIX: Corrected and robust fallback chain: Ollama -> Gemini -> Hugging Face
    try:
        # 1. Try Ollama first
        print("Attempting to use primary model: Ollama")
        response_text = await ollama_client.chat(chat_request.message, "mistral")
        model_used = "ollama:mistral"

    except Exception as ollama_error:
        print(f"Ollama failed: {ollama_error}. Falling back to Gemini.")
        
        # 2. Try Gemini as the second option
        if gemini_client.is_available():
            try:
                print("Attempting to use secondary model: Gemini")
                response_text = await gemini_client.chat(chat_request.message)
                model_used = "gemini:pro"
            except Exception as gemini_error:
                print(f"Gemini failed: {gemini_error}. Falling back to Hugging Face.")
                # 3. Fallback to Hugging Face if both Ollama and Gemini fail
                try:
                    print("Attempting to use fallback model: Hugging Face")
                    response_text = await hf_client.chat(chat_request.message) 
                    model_used = "huggingface:default"
                except Exception as hf_error:
                    print(f"Hugging Face fallback also failed: {hf_error}")
                    raise HTTPException(status_code=503, detail="All AI services are currently unavailable.")
        else:
             # 3. Fallback to Hugging Face if Gemini is not configured
            try:
                print("Gemini not available. Falling back to Hugging Face.")
                response_text = await hf_client.chat(chat_request.message) 
                model_used = "huggingface:default"
            except Exception as hf_error:
                print(f"Hugging Face fallback also failed: {hf_error}")
                raise HTTPException(status_code=503, detail="All AI services are currently unavailable.")

    # Log the successful chat
    chat_log = ChatLog(
        user_id=key_obj.user_id, api_key_id=key_obj.id, message=chat_request.message,
        response=response_text, model=model_used, ip_address=fastapi_request.client.host
    )
    db.add(chat_log)
    db.commit()
    
    return {"response": response_text, "model": model_used}

# ... (The rest of your routes: /plans, /subscribe, /admin/*) ...
# The code for these routes is correct and can remain as you had it.
# I am including them for completeness.

@app.get("/api/plans", response_model=List[PlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    return db.query(Plan).filter(Plan.is_active == True).all()

@app.post("/api/subscribe")
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(Plan).filter(Plan.id == subscription_data.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    stripe_subscription = await stripe_client.create_subscription(current_user.email, plan.stripe_price_id)
    
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        stripe_subscription_id=stripe_subscription["id"],
        status="active",
        current_period_end=datetime.fromtimestamp(stripe_subscription["current_period_end"])
    )
    db.add(subscription)
    
    for key in db.query(APIKey).filter(APIKey.user_id == current_user.id).all():
        key.daily_limit = plan.daily_requests
    
    db.commit()
    return {"message": "Subscription created", "subscription_id": subscription.id}

@app.get("/api/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(User).all()

@app.put("/api/admin/users/{user_id}/limit")
async def update_user_limit(
    user_id: int,
    limit_data: UserLimitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    for key in db.query(APIKey).filter(APIKey.user_id == user_id).all():
        key.daily_limit = limit_data.daily_limit
    
    db.commit()
    return {"message": "Limits updated"}

@app.post("/api/admin/plans", response_model=PlanResponse)
async def create_plan(
    plan_data: PlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    plan = Plan(**plan_data.dict())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@app.get("/api/admin/analytics")
async def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "total_users": db.query(User).count(),
        "total_requests": db.query(ChatLog).count(),
        "active_subscriptions": db.query(Subscription).filter(Subscription.status == "active").count()
    }

@app.get("/api/models")
async def get_available_models():
    models = []
    try:
        ollama_models = await ollama_client.list_models()
        for model in ollama_models.get("models", []):
            models.append({"id": f"ollama:{model['name']}", "name": model['name'], "provider": "ollama", "available": True})
    except Exception:
        pass
    
    if gemini_client.is_available():
        models.append({"id": "gemini:pro", "name": "Gemini Pro", "provider": "gemini", "available": True})
    
    models.append({"id": "huggingface:microsoft/DialoGPT-medium", "name": "DialoGPT Medium", "provider": "huggingface", "available": True})
    
    return {"models": models}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

