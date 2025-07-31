from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
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
import base64


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


# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    total_points: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str

class Matto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    photo_data: str  # base64 encoded image
    nickname: str
    description: str
    rarity: str  # "common", "rare", "epic", "legendary"
    points: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MattoCreate(BaseModel):
    user_id: str
    username: str
    photo_data: str
    nickname: str
    description: str
    rarity: str

# Rarity points mapping
RARITY_POINTS = {
    "common": 10,
    "rare": 25,
    "epic": 50,
    "legendary": 100
}

# Routes
@api_router.get("/")
async def root():
    return {"message": "Fantamatto API - Caccia ai personaggi più pazzi di Ponza!"}

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username già esistente!")
    
    user_dict = user_data.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_leaderboard():
    users = await db.users.find().sort("total_points", -1).to_list(100)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato!")
    return User(**user)

@api_router.post("/matti", response_model=Matto)
async def create_matto(matto_data: MattoCreate):
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
    matti = await db.matti.find().sort("created_at", -1).to_list(100)
    return [Matto(**matto) for matto in matti]

@api_router.get("/matti/user/{user_id}", response_model=List[Matto])
async def get_user_matti(user_id: str):
    matti = await db.matti.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    return [Matto(**matto) for matto in matti]

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