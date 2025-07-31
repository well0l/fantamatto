from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Admin password (in production, use proper authentication)
ADMIN_PASSWORD = "fantamatto2025"

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    total_points: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    total_points: Optional[int] = None
    is_active: Optional[bool] = None

class Matto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    photo_data: str  # base64 encoded image
    nickname: str
    description: str
    rarity: str  # "common", "rare", "epic", "legendary"
    points: int
    is_approved: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MattoCreate(BaseModel):
    user_id: str
    username: str
    photo_data: str
    nickname: str
    description: str
    rarity: str

class MattoUpdate(BaseModel):
    nickname: Optional[str] = None
    description: Optional[str] = None
    rarity: Optional[str] = None
    is_approved: Optional[bool] = None

class AdminLogin(BaseModel):
    password: str

class Stats(BaseModel):
    total_users: int
    total_matti: int
    total_points: int
    pending_matti: int

# Rarity points mapping
RARITY_POINTS = {
    "common": 10,
    "rare": 25,
    "epic": 50,
    "legendary": 100
}

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_admin_password(password: str) -> bool:
    """Verify admin password"""
    return password == ADMIN_PASSWORD

# Public Routes
@api_router.get("/")
async def root():
    return {"message": "Fantamatto API - Caccia ai personaggi più pazzi di Ponza!"}

@api_router.post("/login")
async def login_user(user_data: UserLogin):
    # Find user by username
    user = await db.users.find_one({"username": user_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Username non trovato!")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account disattivato!")
    
    # Verify password
    hashed_password = hash_password(user_data.password)
    if user.get("password") != hashed_password:
        raise HTTPException(status_code=401, detail="Password errata!")
    
    return User(**user)

@api_router.get("/leaderboard", response_model=List[User])
async def get_leaderboard():
    users = await db.users.find({"is_active": True}).sort("total_points", -1).to_list(100)
    return [User(**user) for user in users]

@api_router.post("/matti", response_model=Matto)
async def create_matto(matto_data: MattoCreate):
    # Verify user exists and is active
    user = await db.users.find_one({"id": matto_data.user_id, "is_active": True})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato o disattivato!")
    
    # Calculate points based on rarity
    points = RARITY_POINTS.get(matto_data.rarity.lower(), 10)
    
    matto_dict = matto_data.dict()
    matto_dict["points"] = points
    matto_obj = Matto(**matto_dict)
    
    # Insert matto
    await db.matti.insert_one(matto_obj.dict())
    
    # Update user's total points
    await db.users.update_one(
        {"id": matto_data.user_id},
        {"$inc": {"total_points": points}}
    )
    
    return matto_obj

@api_router.get("/matti", response_model=List[Matto])
async def get_matti():
    matti = await db.matti.find({"is_approved": True}).sort("created_at", -1).to_list(100)
    return [Matto(**matto) for matto in matti]

@api_router.get("/matti/user/{user_id}", response_model=List[Matto])
async def get_user_matti(user_id: str):
    matti = await db.matti.find({"user_id": user_id, "is_approved": True}).sort("created_at", -1).to_list(100)
    return [Matto(**matto) for matto in matti]

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(admin_data: AdminLogin):
    if not verify_admin_password(admin_data.password):
        raise HTTPException(status_code=401, detail="Password admin errata!")
    return {"message": "Login admin riuscito", "is_admin": True}

@api_router.get("/admin/stats", response_model=Stats)
async def get_admin_stats(admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    total_users = await db.users.count_documents({})
    total_matti = await db.matti.count_documents({})
    total_points = await db.users.aggregate([{"$group": {"_id": None, "total": {"$sum": "$total_points"}}}]).to_list(1)
    pending_matti = await db.matti.count_documents({"is_approved": False})
    
    total_points_sum = total_points[0]["total"] if total_points else 0
    
    return Stats(
        total_users=total_users,
        total_matti=total_matti,
        total_points=total_points_sum,
        pending_matti=pending_matti
    )

# Admin User Management
@api_router.post("/admin/users", response_model=User)
async def admin_create_user(user_data: UserCreate, admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username già esistente!")
    
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/admin/users", response_model=List[User])
async def admin_get_users(admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    users = await db.users.find().sort("created_at", -1).to_list(1000)
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}", response_model=User)
async def admin_update_user(user_id: str, user_update: UserUpdate, admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    # Hash password if provided
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utente non trovato!")
    
    user = await db.users.find_one({"id": user_id})
    return User(**user)

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    # Also delete user's matti
    await db.matti.delete_many({"user_id": user_id})
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utente non trovato!")
    
    return {"message": "Utente eliminato con successo!"}

# Admin Matti Management
@api_router.get("/admin/matti", response_model=List[Matto])
async def admin_get_matti(admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    matti = await db.matti.find().sort("created_at", -1).to_list(1000)
    return [Matto(**matto) for matto in matti]

@api_router.put("/admin/matti/{matto_id}", response_model=Matto)
async def admin_update_matto(matto_id: str, matto_update: MattoUpdate, admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    # Get current matto
    current_matto = await db.matti.find_one({"id": matto_id})
    if not current_matto:
        raise HTTPException(status_code=404, detail="Matto non trovato!")
    
    update_data = {k: v for k, v in matto_update.dict().items() if v is not None}
    
    # Recalculate points if rarity changed
    if "rarity" in update_data:
        old_points = current_matto["points"]
        new_points = RARITY_POINTS.get(update_data["rarity"].lower(), 10)
        update_data["points"] = new_points
        
        # Update user's total points
        points_diff = new_points - old_points
        await db.users.update_one(
            {"id": current_matto["user_id"]},
            {"$inc": {"total_points": points_diff}}
        )
    
    result = await db.matti.update_one({"id": matto_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matto non trovato!")
    
    matto = await db.matti.find_one({"id": matto_id})
    return Matto(**matto)

@api_router.delete("/admin/matti/{matto_id}")
async def admin_delete_matto(matto_id: str, admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    # Get matto to subtract points
    matto = await db.matti.find_one({"id": matto_id})
    if matto:
        # Subtract points from user
        await db.users.update_one(
            {"id": matto["user_id"]},
            {"$inc": {"total_points": -matto["points"]}}
        )
    
    result = await db.matti.delete_one({"id": matto_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Matto non trovato!")
    
    return {"message": "Matto eliminato con successo!"}

@api_router.post("/admin/reset-points")
async def admin_reset_all_points(admin_password: str):
    if not verify_admin_password(admin_password):
        raise HTTPException(status_code=401, detail="Non autorizzato!")
    
    await db.users.update_many({}, {"$set": {"total_points": 0}})
    return {"message": "Tutti i punti sono stati resettati!"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()