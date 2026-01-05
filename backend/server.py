from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
import json
from pywebpush import webpush, WebPushException
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'village_friends_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'support@villagefriends.app')

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "monthly": {"price": 9.99, "name": "Monthly Membership", "duration_days": 30},
    "annual": {"price": 89.99, "name": "Annual Membership", "duration_days": 365}
}

FREE_TRIAL_DAYS = 14

app = FastAPI(title="Village Friends API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    email_verified: bool = False
    id_verified: bool = False
    subscription_status: str = "trial"
    trial_ends_at: Optional[str] = None
    subscription_ends_at: Optional[str] = None
    created_at: str

class FamilyProfileCreate(BaseModel):
    family_name: str
    bio: Optional[str] = None
    city: str
    state: str
    zip_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    interests: List[str] = []
    kids: List[Dict[str, Any]] = []  # [{name, age, interests}]
    search_radius: int = 25  # miles
    profile_picture: Optional[str] = None

class FamilyProfileResponse(BaseModel):
    family_id: str
    user_id: str
    family_name: str
    bio: Optional[str] = None
    city: str
    state: str
    zip_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    interests: List[str] = []
    kids: List[Dict[str, Any]] = []
    search_radius: int = 25
    profile_picture: Optional[str] = None
    created_at: str
    updated_at: str

class EventCreate(BaseModel):
    title: str
    description: str
    event_date: str
    event_time: str
    location: str
    city: str
    state: str
    zip_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_attendees: Optional[int] = None
    age_range: Optional[str] = None
    event_type: str = "meetup"  # meetup, playdate, field_trip, etc.

class EventResponse(BaseModel):
    event_id: str
    host_family_id: str
    host_family_name: str
    title: str
    description: str
    event_date: str
    event_time: str
    location: str
    city: str
    state: str
    zip_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_attendees: Optional[int] = None
    age_range: Optional[str] = None
    event_type: str
    attendees: List[Dict[str, Any]] = []
    status: str = "upcoming"
    created_at: str

class MessageCreate(BaseModel):
    recipient_family_id: str
    content: str

class MessageResponse(BaseModel):
    message_id: str
    sender_family_id: str
    sender_family_name: str
    recipient_family_id: str
    content: str
    read: bool = False
    created_at: str

class MeetupRequestCreate(BaseModel):
    target_family_id: str
    proposed_date: str
    proposed_time: str
    location: str
    message: Optional[str] = None

class MeetupRequestResponse(BaseModel):
    request_id: str
    requester_family_id: str
    requester_family_name: str
    target_family_id: str
    proposed_date: str
    proposed_time: str
    location: str
    message: Optional[str] = None
    status: str = "pending"  # pending, accepted, declined
    created_at: str

class CoopGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    city: str
    state: str
    zip_code: str
    group_type: str = "co-op"  # co-op, support_group, activity_club
    focus_areas: List[str] = []  # subjects/activities the group focuses on
    age_range: Optional[str] = None
    meeting_frequency: Optional[str] = None  # weekly, bi-weekly, monthly
    max_members: Optional[int] = None
    is_private: bool = False

class CoopGroupResponse(BaseModel):
    group_id: str
    owner_family_id: str
    owner_family_name: str
    name: str
    description: Optional[str] = None
    city: str
    state: str
    zip_code: str
    group_type: str
    focus_areas: List[str] = []
    age_range: Optional[str] = None
    meeting_frequency: Optional[str] = None
    max_members: Optional[int] = None
    is_private: bool = False
    members: List[Dict[str, Any]] = []
    member_count: int = 0
    created_at: str

class CoopAnnouncementCreate(BaseModel):
    title: str
    content: str
    pinned: bool = False

# Push Notification Models
class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]  # {p256dh, auth}

class NotificationPreferences(BaseModel):
    messages: bool = True
    events: bool = True
    meetup_requests: bool = True
    group_updates: bool = True

# ============ PUSH NOTIFICATION HELPER FUNCTIONS ============

async def send_push_notification(user_id: str, title: str, body: str, url: str = "/", data: Dict = None):
    """Send push notification to all subscriptions for a user"""
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return
    
    subscriptions = await db.push_subscriptions.find({"user_id": user_id}).to_list(10)
    
    if not subscriptions:
        return
    
    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "data": data or {},
        "icon": "/icons/icon-192x192.png",
        "badge": "/icons/icon-72x72.png"
    })
    
    vapid_claims = {
        "sub": f"mailto:{VAPID_CLAIMS_EMAIL}"
    }
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": sub["keys"]
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=vapid_claims
            )
            logger.info(f"Push notification sent to user {user_id}")
        except WebPushException as e:
            logger.error(f"Push notification failed: {e}")
            # Remove invalid subscriptions
            if e.response and e.response.status_code in [404, 410]:
                await db.push_subscriptions.delete_one({"_id": sub["_id"]})
                logger.info(f"Removed invalid subscription for user {user_id}")
        except Exception as e:
            logger.error(f"Push notification error: {e}")

async def notify_new_message(sender_family_name: str, recipient_user_id: str, preview: str):
    """Send notification for new message"""
    # Check user preferences
    user = await db.users.find_one({"user_id": recipient_user_id})
    prefs = user.get("notification_preferences", {})
    if not prefs.get("messages", True):
        return
    
    await send_push_notification(
        user_id=recipient_user_id,
        title=f"New message from {sender_family_name}",
        body=preview[:100] + "..." if len(preview) > 100 else preview,
        url="/messages"
    )

async def notify_new_event(event_title: str, host_family_name: str, nearby_user_ids: List[str]):
    """Send notification for new event to nearby users"""
    for user_id in nearby_user_ids:
        user = await db.users.find_one({"user_id": user_id})
        prefs = user.get("notification_preferences", {}) if user else {}
        if not prefs.get("events", True):
            continue
        
        await send_push_notification(
            user_id=user_id,
            title="New Event Near You!",
            body=f"{host_family_name} is hosting: {event_title}",
            url="/events"
        )

async def notify_meetup_request(requester_family_name: str, target_user_id: str, status: str = "new"):
    """Send notification for meetup request"""
    user = await db.users.find_one({"user_id": target_user_id})
    prefs = user.get("notification_preferences", {}) if user else {}
    if not prefs.get("meetup_requests", True):
        return
    
    if status == "new":
        title = "New Meetup Request!"
        body = f"{requester_family_name} wants to meet up with your family"
    elif status == "accepted":
        title = "Meetup Request Accepted!"
        body = f"{requester_family_name} accepted your meetup request"
    elif status == "declined":
        title = "Meetup Request Update"
        body = f"{requester_family_name} couldn't make the meetup"
    else:
        return
    
    await send_push_notification(
        user_id=target_user_id,
        title=title,
        body=body,
        url="/dashboard"
    )

async def notify_group_update(group_name: str, member_user_ids: List[str], update_type: str, details: str = ""):
    """Send notification for group updates"""
    for user_id in member_user_ids:
        user = await db.users.find_one({"user_id": user_id})
        prefs = user.get("notification_preferences", {}) if user else {}
        if not prefs.get("group_updates", True):
            continue
        
        if update_type == "announcement":
            title = f"New announcement in {group_name}"
        elif update_type == "new_member":
            title = f"New member joined {group_name}"
        elif update_type == "event":
            title = f"New event in {group_name}"
        else:
            title = f"Update in {group_name}"
        
        await send_push_notification(
            user_id=user_id,
            title=title,
            body=details,
            url="/groups"
        )

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_jwt_token(token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    R = 3959  # Earth's radius in miles
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    trial_ends = now + timedelta(days=FREE_TRIAL_DAYS)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "email_verified": False,
        "id_verified": False,
        "subscription_status": "trial",
        "trial_ends_at": trial_ends.isoformat(),
        "subscription_ends_at": None,
        "created_at": now.isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "email_verified": False,
            "id_verified": False,
            "subscription_status": "trial",
            "trial_ends_at": trial_ends.isoformat()
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
            "email_verified": user.get("email_verified", False),
            "id_verified": user.get("id_verified", False),
            "subscription_status": user.get("subscription_status", "trial"),
            "trial_ends_at": user.get("trial_ends_at"),
            "subscription_ends_at": user.get("subscription_ends_at")
        }
    }

@api_router.post("/auth/google/session")
async def google_auth_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        google_data = resp.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": google_data["email"]},
            {"$set": {
                "name": google_data["name"],
                "picture": google_data.get("picture")
            }}
        )
        user_id = user["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        trial_ends = now + timedelta(days=FREE_TRIAL_DAYS)
        
        user_doc = {
            "user_id": user_id,
            "email": google_data["email"],
            "name": google_data["name"],
            "picture": google_data.get("picture"),
            "email_verified": True,  # Google verified
            "id_verified": False,
            "subscription_status": "trial",
            "trial_ends_at": trial_ends.isoformat(),
            "subscription_ends_at": None,
            "created_at": now.isoformat()
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    
    # Create session
    session_token = google_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user_response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "email_verified": user.get("email_verified", False),
        "id_verified": user.get("id_verified", False),
        "subscription_status": user.get("subscription_status", "trial"),
        "trial_ends_at": user.get("trial_ends_at"),
        "subscription_ends_at": user.get("subscription_ends_at")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ FAMILY PROFILE ENDPOINTS ============

@api_router.post("/family/profile", response_model=FamilyProfileResponse)
async def create_family_profile(profile: FamilyProfileCreate, user: dict = Depends(get_current_user)):
    existing = await db.family_profiles.find_one({"user_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Family profile already exists")
    
    family_id = f"family_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    profile_doc = {
        "family_id": family_id,
        "user_id": user["user_id"],
        "family_name": profile.family_name,
        "bio": profile.bio,
        "city": profile.city,
        "state": profile.state,
        "zip_code": profile.zip_code,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "interests": profile.interests,
        "kids": profile.kids,
        "search_radius": profile.search_radius,
        "profile_picture": profile.profile_picture,
        "created_at": now,
        "updated_at": now
    }
    
    await db.family_profiles.insert_one(profile_doc)
    
    return FamilyProfileResponse(**profile_doc)

@api_router.get("/family/profile")
async def get_my_family_profile(user: dict = Depends(get_current_user)):
    profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        return None
    return profile

@api_router.put("/family/profile")
async def update_family_profile(profile: FamilyProfileCreate, user: dict = Depends(get_current_user)):
    existing = await db.family_profiles.find_one({"user_id": user["user_id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.family_profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    updated = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@api_router.get("/family/{family_id}")
async def get_family_by_id(family_id: str, user: dict = Depends(get_current_user)):
    profile = await db.family_profiles.find_one({"family_id": family_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Family not found")
    return profile

# ============ PHOTO UPLOAD ENDPOINTS ============

class PhotoUploadRequest(BaseModel):
    image_data: str  # Base64 encoded image

@api_router.post("/family/profile/photo")
async def upload_profile_photo(photo_data: PhotoUploadRequest, user: dict = Depends(get_current_user)):
    """Upload a profile photo for the family (base64 encoded)"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    try:
        # Extract base64 data (handle data URL format)
        image_data = photo_data.image_data
        if ',' in image_data:
            # Data URL format: data:image/jpeg;base64,/9j/4AAQ...
            header, image_data = image_data.split(',', 1)
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Generate unique filename
        file_ext = "jpg"  # Default to jpg
        filename = f"profile_{my_profile['family_id']}_{uuid.uuid4().hex[:8]}.{file_ext}"
        filepath = UPLOAD_DIR / filename
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        # Generate URL (relative path that will be served)
        photo_url = f"/api/uploads/{filename}"
        
        # Update profile with new photo URL
        await db.family_profiles.update_one(
            {"family_id": my_profile["family_id"]},
            {"$set": {"profile_picture": photo_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"photo_url": photo_url, "message": "Photo uploaded successfully"}
    except Exception as e:
        logger.error(f"Photo upload error: {e}")
        raise HTTPException(status_code=400, detail="Failed to upload photo")

@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve uploaded files"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(filepath)

# ============ FAMILY DISCOVERY ENDPOINTS ============

@api_router.get("/families/nearby")
async def get_nearby_families(
    zip_code: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    radius: int = 25,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    interests: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    query = {"user_id": {"$ne": user["user_id"]}}
    
    if zip_code:
        query["zip_code"] = zip_code
    elif city and state:
        query["city"] = {"$regex": city, "$options": "i"}
        query["state"] = {"$regex": state, "$options": "i"}
    elif my_profile:
        # Use user's location
        if my_profile.get("latitude") and my_profile.get("longitude"):
            # Will filter by distance after query
            pass
        else:
            query["zip_code"] = my_profile.get("zip_code")
    
    # Filter by interests if provided
    if interests:
        interest_list = [i.strip() for i in interests.split(",")]
        query["interests"] = {"$in": interest_list}
    
    families = await db.family_profiles.find(query, {"_id": 0}).to_list(100)
    
    # Filter by kids' age range if provided
    if min_age is not None or max_age is not None:
        age_filtered = []
        for f in families:
            kids = f.get("kids", [])
            if not kids:
                continue
            # Check if any kid is within the age range
            for kid in kids:
                kid_age = kid.get("age", 0)
                if min_age is not None and kid_age < min_age:
                    continue
                if max_age is not None and kid_age > max_age:
                    continue
                age_filtered.append(f)
                break
        families = age_filtered
    
    # Filter by distance if coordinates available
    if my_profile and my_profile.get("latitude") and my_profile.get("longitude"):
        filtered = []
        for f in families:
            if f.get("latitude") and f.get("longitude"):
                dist = calculate_distance(
                    my_profile["latitude"], my_profile["longitude"],
                    f["latitude"], f["longitude"]
                )
                if dist <= radius:
                    f["distance"] = round(dist, 1)
                    filtered.append(f)
            else:
                # Include families without coords in same zip
                if f.get("zip_code") == my_profile.get("zip_code"):
                    f["distance"] = None
                    filtered.append(f)
        families = sorted(filtered, key=lambda x: x.get("distance") or 999)
    
    return families

@api_router.get("/families/search")
async def search_families(
    q: Optional[str] = None,
    interests: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"user_id": {"$ne": user["user_id"]}}
    
    if q:
        query["$or"] = [
            {"family_name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"bio": {"$regex": q, "$options": "i"}}
        ]
    
    if interests:
        interest_list = [i.strip() for i in interests.split(",")]
        query["interests"] = {"$in": interest_list}
    
    families = await db.family_profiles.find(query, {"_id": 0}).to_list(50)
    return families

# ============ EVENT ENDPOINTS ============

@api_router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    event_id = f"event_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    event_doc = {
        "event_id": event_id,
        "host_family_id": my_profile["family_id"],
        "host_family_name": my_profile["family_name"],
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "location": event.location,
        "city": event.city,
        "state": event.state,
        "zip_code": event.zip_code,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "max_attendees": event.max_attendees,
        "age_range": event.age_range,
        "event_type": event.event_type,
        "attendees": [],
        "status": "upcoming",
        "created_at": now
    }
    
    await db.events.insert_one(event_doc)
    
    # Notify nearby families about the new event
    nearby_families = await db.family_profiles.find(
        {
            "user_id": {"$ne": user["user_id"]},
            "$or": [
                {"city": {"$regex": event.city, "$options": "i"}},
                {"zip_code": event.zip_code}
            ]
        },
        {"user_id": 1}
    ).to_list(50)
    
    nearby_user_ids = [f["user_id"] for f in nearby_families]
    if nearby_user_ids:
        await notify_new_event(
            event_title=event.title,
            host_family_name=my_profile["family_name"],
            nearby_user_ids=nearby_user_ids
        )
    
    return EventResponse(**event_doc)

@api_router.get("/events")
async def get_events(
    city: Optional[str] = None,
    event_type: Optional[str] = None,
    upcoming_only: bool = True,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    if event_type:
        query["event_type"] = event_type
    
    if upcoming_only:
        query["event_date"] = {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        query["status"] = "upcoming"
    
    events = await db.events.find(query, {"_id": 0}).sort("event_date", 1).to_list(50)
    return events

@api_router.get("/events/my")
async def get_my_events(user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return []
    
    # Events I'm hosting
    hosted = await db.events.find(
        {"host_family_id": my_profile["family_id"]},
        {"_id": 0}
    ).to_list(50)
    
    # Events I'm attending
    attending = await db.events.find(
        {"attendees.family_id": my_profile["family_id"]},
        {"_id": 0}
    ).to_list(50)
    
    return {"hosted": hosted, "attending": attending}

@api_router.post("/events/{event_id}/rsvp")
async def rsvp_event(event_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    event = await db.events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already attending
    for att in event.get("attendees", []):
        if att["family_id"] == my_profile["family_id"]:
            raise HTTPException(status_code=400, detail="Already registered")
    
    # Check max attendees
    if event.get("max_attendees") and len(event.get("attendees", [])) >= event["max_attendees"]:
        raise HTTPException(status_code=400, detail="Event is full")
    
    attendee = {
        "family_id": my_profile["family_id"],
        "family_name": my_profile["family_name"],
        "rsvp_date": datetime.now(timezone.utc).isoformat()
    }
    
    await db.events.update_one(
        {"event_id": event_id},
        {"$push": {"attendees": attendee}}
    )
    
    return {"message": "RSVP successful"}

@api_router.delete("/events/{event_id}/rsvp")
async def cancel_rsvp(event_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    await db.events.update_one(
        {"event_id": event_id},
        {"$pull": {"attendees": {"family_id": my_profile["family_id"]}}}
    )
    
    return {"message": "RSVP cancelled"}

@api_router.get("/events/{event_id}")
async def get_event(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# ============ MESSAGING ENDPOINTS ============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(message: MessageCreate, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        "message_id": message_id,
        "sender_family_id": my_profile["family_id"],
        "sender_family_name": my_profile["family_name"],
        "recipient_family_id": message.recipient_family_id,
        "content": message.content,
        "read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    # Send push notification to recipient
    recipient_profile = await db.family_profiles.find_one(
        {"family_id": message.recipient_family_id},
        {"user_id": 1}
    )
    if recipient_profile:
        await notify_new_message(
            sender_family_name=my_profile["family_name"],
            recipient_user_id=recipient_profile["user_id"],
            preview=message.content
        )
    
    return MessageResponse(**message_doc)

@api_router.get("/messages")
async def get_messages(user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return []
    
    messages = await db.messages.find(
        {"$or": [
            {"sender_family_id": my_profile["family_id"]},
            {"recipient_family_id": my_profile["family_id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return messages

@api_router.get("/messages/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return []
    
    # Get all messages for this user
    messages = await db.messages.find(
        {"$or": [
            {"sender_family_id": my_profile["family_id"]},
            {"recipient_family_id": my_profile["family_id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # First pass: collect unique family IDs and latest messages
    conversation_data = {}
    for msg in messages:
        other_family_id = msg["recipient_family_id"] if msg["sender_family_id"] == my_profile["family_id"] else msg["sender_family_id"]
        if other_family_id not in conversation_data:
            conversation_data[other_family_id] = {
                "last_message": msg["content"],
                "last_message_date": msg["created_at"],
                "unread": not msg["read"] and msg["recipient_family_id"] == my_profile["family_id"]
            }
    
    # Batch fetch all family profiles in one query (fix N+1)
    family_ids = list(conversation_data.keys())
    if not family_ids:
        return []
    
    family_profiles = await db.family_profiles.find(
        {"family_id": {"$in": family_ids}},
        {"_id": 0, "family_id": 1, "family_name": 1, "profile_picture": 1}
    ).to_list(len(family_ids))
    
    # Create lookup dict
    profiles_lookup = {f["family_id"]: f for f in family_profiles}
    
    # Build final conversations list
    conversations = []
    for family_id, data in conversation_data.items():
        profile = profiles_lookup.get(family_id, {})
        conversations.append({
            "family_id": family_id,
            "family_name": profile.get("family_name", "Unknown"),
            "profile_picture": profile.get("profile_picture"),
            "last_message": data["last_message"],
            "last_message_date": data["last_message_date"],
            "unread": data["unread"]
        })
    
    return conversations

@api_router.get("/messages/{family_id}")
async def get_conversation(family_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return []
    
    messages = await db.messages.find(
        {"$or": [
            {"sender_family_id": my_profile["family_id"], "recipient_family_id": family_id},
            {"sender_family_id": family_id, "recipient_family_id": my_profile["family_id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_family_id": family_id, "recipient_family_id": my_profile["family_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

# ============ MEETUP REQUEST ENDPOINTS ============

@api_router.post("/meetup-requests", response_model=MeetupRequestResponse)
async def create_meetup_request(request_data: MeetupRequestCreate, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    request_id = f"meetup_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    request_doc = {
        "request_id": request_id,
        "requester_family_id": my_profile["family_id"],
        "requester_family_name": my_profile["family_name"],
        "target_family_id": request_data.target_family_id,
        "proposed_date": request_data.proposed_date,
        "proposed_time": request_data.proposed_time,
        "location": request_data.location,
        "message": request_data.message,
        "status": "pending",
        "created_at": now
    }
    
    await db.meetup_requests.insert_one(request_doc)
    
    # Send push notification to target family
    target_profile = await db.family_profiles.find_one(
        {"family_id": request_data.target_family_id},
        {"user_id": 1}
    )
    if target_profile:
        await notify_meetup_request(
            requester_family_name=my_profile["family_name"],
            target_user_id=target_profile["user_id"],
            status="new"
        )
    
    return MeetupRequestResponse(**request_doc)

@api_router.get("/meetup-requests")
async def get_meetup_requests(user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return {"incoming": [], "outgoing": []}
    
    incoming = await db.meetup_requests.find(
        {"target_family_id": my_profile["family_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    outgoing = await db.meetup_requests.find(
        {"requester_family_id": my_profile["family_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"incoming": incoming, "outgoing": outgoing}

@api_router.put("/meetup-requests/{request_id}")
async def respond_meetup_request(request_id: str, status: str, user: dict = Depends(get_current_user)):
    if status not in ["accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    request_doc = await db.meetup_requests.find_one({"request_id": request_id})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_doc["target_family_id"] != my_profile["family_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.meetup_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": status}}
    )
    
    # If accepted, create a confirmed meetup event
    if status == "accepted":
        event_id = f"event_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        requester_profile = await db.family_profiles.find_one(
            {"family_id": request_doc["requester_family_id"]}, {"_id": 0}
        )
        
        event_doc = {
            "event_id": event_id,
            "host_family_id": request_doc["requester_family_id"],
            "host_family_name": requester_profile["family_name"] if requester_profile else "Unknown",
            "title": f"Meetup with {my_profile['family_name']}",
            "description": request_doc.get("message", "Scheduled meetup"),
            "event_date": request_doc["proposed_date"],
            "event_time": request_doc["proposed_time"],
            "location": request_doc["location"],
            "city": my_profile.get("city", ""),
            "state": my_profile.get("state", ""),
            "zip_code": my_profile.get("zip_code", ""),
            "max_attendees": 2,
            "event_type": "meetup",
            "attendees": [
                {"family_id": my_profile["family_id"], "family_name": my_profile["family_name"], "rsvp_date": now}
            ],
            "status": "confirmed",
            "created_at": now
        }
        
        await db.events.insert_one(event_doc)
    
    return {"message": f"Request {status}"}

# ============ CO-OP / GROUP ENDPOINTS (PREMIUM) ============

async def check_premium_access(user: dict) -> bool:
    """Check if user has premium (active subscription) access for co-op features"""
    return user.get("subscription_status") == "active"

@api_router.post("/groups", response_model=CoopGroupResponse)
async def create_group(group: CoopGroupCreate, user: dict = Depends(get_current_user)):
    # Check premium access
    if not await check_premium_access(user):
        raise HTTPException(status_code=403, detail="Premium subscription required for co-op/group management")
    
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    group_id = f"group_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    group_doc = {
        "group_id": group_id,
        "owner_family_id": my_profile["family_id"],
        "owner_family_name": my_profile["family_name"],
        "name": group.name,
        "description": group.description,
        "city": group.city,
        "state": group.state,
        "zip_code": group.zip_code,
        "group_type": group.group_type,
        "focus_areas": group.focus_areas,
        "age_range": group.age_range,
        "meeting_frequency": group.meeting_frequency,
        "max_members": group.max_members,
        "is_private": group.is_private,
        "members": [{"family_id": my_profile["family_id"], "family_name": my_profile["family_name"], "role": "owner", "joined_at": now}],
        "member_count": 1,
        "announcements": [],
        "created_at": now
    }
    
    await db.coop_groups.insert_one(group_doc)
    return CoopGroupResponse(**group_doc)

@api_router.get("/groups")
async def get_groups(
    city: Optional[str] = None,
    group_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"is_private": False}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    if group_type:
        query["group_type"] = group_type
    
    groups = await db.coop_groups.find(query, {"_id": 0, "announcements": 0}).to_list(50)
    return groups

@api_router.get("/groups/my")
async def get_my_groups(user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return {"owned": [], "member_of": []}
    
    owned = await db.coop_groups.find(
        {"owner_family_id": my_profile["family_id"]},
        {"_id": 0}
    ).to_list(50)
    
    member_of = await db.coop_groups.find(
        {"members.family_id": my_profile["family_id"], "owner_family_id": {"$ne": my_profile["family_id"]}},
        {"_id": 0}
    ).to_list(50)
    
    return {"owned": owned, "member_of": member_of}

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, user: dict = Depends(get_current_user)):
    group = await db.coop_groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    # Check if user is a member (for private groups)
    if group.get("is_private"):
        is_member = any(m["family_id"] == my_profile["family_id"] for m in group.get("members", []))
        if not is_member:
            raise HTTPException(status_code=403, detail="This group is private")
    
    return group

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if already a member
    if any(m["family_id"] == my_profile["family_id"] for m in group.get("members", [])):
        raise HTTPException(status_code=400, detail="Already a member")
    
    # Check max members
    if group.get("max_members") and len(group.get("members", [])) >= group["max_members"]:
        raise HTTPException(status_code=400, detail="Group is full")
    
    # Check if private
    if group.get("is_private"):
        # Add to pending requests instead
        await db.coop_groups.update_one(
            {"group_id": group_id},
            {"$push": {"join_requests": {
                "family_id": my_profile["family_id"],
                "family_name": my_profile["family_name"],
                "requested_at": datetime.now(timezone.utc).isoformat()
            }}}
        )
        return {"message": "Join request sent to group owner"}
    
    now = datetime.now(timezone.utc).isoformat()
    member = {
        "family_id": my_profile["family_id"],
        "family_name": my_profile["family_name"],
        "role": "member",
        "joined_at": now
    }
    
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$push": {"members": member}, "$inc": {"member_count": 1}}
    )
    
    return {"message": "Joined group successfully"}

@api_router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group["owner_family_id"] == my_profile["family_id"]:
        raise HTTPException(status_code=400, detail="Owner cannot leave. Transfer ownership or delete the group.")
    
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$pull": {"members": {"family_id": my_profile["family_id"]}}, "$inc": {"member_count": -1}}
    )
    
    return {"message": "Left group"}

@api_router.post("/groups/{group_id}/announcements")
async def create_announcement(group_id: str, announcement: CoopAnnouncementCreate, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is owner or admin
    member = next((m for m in group.get("members", []) if m["family_id"] == my_profile["family_id"]), None)
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners/admins can post announcements")
    
    announcement_id = f"ann_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    announcement_doc = {
        "announcement_id": announcement_id,
        "title": announcement.title,
        "content": announcement.content,
        "pinned": announcement.pinned,
        "author_family_id": my_profile["family_id"],
        "author_family_name": my_profile["family_name"],
        "created_at": now
    }
    
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$push": {"announcements": {"$each": [announcement_doc], "$position": 0}}}
    )
    
    return announcement_doc

@api_router.post("/groups/{group_id}/events")
async def create_group_event(group_id: str, event: EventCreate, user: dict = Depends(get_current_user)):
    """Create an event specifically for a co-op group"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Create a family profile first")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is a member
    if not any(m["family_id"] == my_profile["family_id"] for m in group.get("members", [])):
        raise HTTPException(status_code=403, detail="Must be a group member")
    
    event_id = f"event_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    event_doc = {
        "event_id": event_id,
        "group_id": group_id,
        "group_name": group["name"],
        "host_family_id": my_profile["family_id"],
        "host_family_name": my_profile["family_name"],
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "location": event.location,
        "city": event.city,
        "state": event.state,
        "zip_code": event.zip_code,
        "max_attendees": event.max_attendees,
        "age_range": event.age_range,
        "event_type": event.event_type,
        "attendees": [],
        "status": "upcoming",
        "created_at": now
    }
    
    await db.events.insert_one(event_doc)
    return EventResponse(**event_doc)

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str, user: dict = Depends(get_current_user)):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group["owner_family_id"] != my_profile["family_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can delete the group")
    
    await db.coop_groups.delete_one({"group_id": group_id})
    return {"message": "Group deleted"}

# ============ GROUP MEMBER ROLE MANAGEMENT ============

class MemberRoleUpdate(BaseModel):
    family_id: str
    role: str  # member, admin

@api_router.put("/groups/{group_id}/members/role")
async def update_member_role(group_id: str, role_update: MemberRoleUpdate, user: dict = Depends(get_current_user)):
    """Update a member's role (owner only) - can promote to admin or demote to member"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Only owner can change roles
    if group["owner_family_id"] != my_profile["family_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can change member roles")
    
    # Can't change owner's role
    if role_update.family_id == group["owner_family_id"]:
        raise HTTPException(status_code=400, detail="Cannot change owner's role")
    
    # Validate role
    if role_update.role not in ["member", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be 'member' or 'admin'")
    
    # Check if target is a member
    member_exists = any(m["family_id"] == role_update.family_id for m in group.get("members", []))
    if not member_exists:
        raise HTTPException(status_code=404, detail="Member not found in group")
    
    # Update the member's role
    await db.coop_groups.update_one(
        {"group_id": group_id, "members.family_id": role_update.family_id},
        {"$set": {"members.$.role": role_update.role}}
    )
    
    return {"message": f"Member role updated to {role_update.role}"}

@api_router.delete("/groups/{group_id}/members/{family_id}")
async def remove_member(group_id: str, family_id: str, user: dict = Depends(get_current_user)):
    """Remove a member from the group (owner or admin only)"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if requester is owner or admin
    requester_member = next((m for m in group.get("members", []) if m["family_id"] == my_profile["family_id"]), None)
    if not requester_member or requester_member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can remove members")
    
    # Can't remove the owner
    if family_id == group["owner_family_id"]:
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    
    # Admins can't remove other admins (only owner can)
    target_member = next((m for m in group.get("members", []) if m["family_id"] == family_id), None)
    if target_member and target_member.get("role") == "admin" and requester_member.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can remove admins")
    
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$pull": {"members": {"family_id": family_id}}, "$inc": {"member_count": -1}}
    )
    
    return {"message": "Member removed"}

@api_router.post("/groups/{group_id}/transfer-ownership")
async def transfer_ownership(group_id: str, new_owner_family_id: str, user: dict = Depends(get_current_user)):
    """Transfer group ownership to another member"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Only owner can transfer
    if group["owner_family_id"] != my_profile["family_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can transfer ownership")
    
    # Check if new owner is a member
    new_owner_member = next((m for m in group.get("members", []) if m["family_id"] == new_owner_family_id), None)
    if not new_owner_member:
        raise HTTPException(status_code=404, detail="New owner must be a group member")
    
    # Get new owner's family name
    new_owner_profile = await db.family_profiles.find_one({"family_id": new_owner_family_id}, {"_id": 0})
    
    # Update group owner
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$set": {
            "owner_family_id": new_owner_family_id,
            "owner_family_name": new_owner_profile["family_name"] if new_owner_profile else "Unknown"
        }}
    )
    
    # Update member roles - new owner becomes owner, old owner becomes admin
    await db.coop_groups.update_one(
        {"group_id": group_id, "members.family_id": new_owner_family_id},
        {"$set": {"members.$.role": "owner"}}
    )
    await db.coop_groups.update_one(
        {"group_id": group_id, "members.family_id": my_profile["family_id"]},
        {"$set": {"members.$.role": "admin"}}
    )
    
    return {"message": "Ownership transferred successfully"}

@api_router.get("/groups/{group_id}/join-requests")
async def get_join_requests(group_id: str, user: dict = Depends(get_current_user)):
    """Get pending join requests for a private group (owner/admin only)"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if requester is owner or admin
    member = next((m for m in group.get("members", []) if m["family_id"] == my_profile["family_id"]), None)
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can view join requests")
    
    return group.get("join_requests", [])

@api_router.post("/groups/{group_id}/join-requests/{family_id}/approve")
async def approve_join_request(group_id: str, family_id: str, user: dict = Depends(get_current_user)):
    """Approve a join request (owner/admin only)"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if requester is owner or admin
    member = next((m for m in group.get("members", []) if m["family_id"] == my_profile["family_id"]), None)
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can approve requests")
    
    # Find the join request
    join_request = next((r for r in group.get("join_requests", []) if r["family_id"] == family_id), None)
    if not join_request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    now = datetime.now(timezone.utc).isoformat()
    new_member = {
        "family_id": family_id,
        "family_name": join_request["family_name"],
        "role": "member",
        "joined_at": now
    }
    
    # Add member and remove from join requests
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {
            "$push": {"members": new_member},
            "$pull": {"join_requests": {"family_id": family_id}},
            "$inc": {"member_count": 1}
        }
    )
    
    return {"message": "Join request approved"}

@api_router.post("/groups/{group_id}/join-requests/{family_id}/reject")
async def reject_join_request(group_id: str, family_id: str, user: dict = Depends(get_current_user)):
    """Reject a join request (owner/admin only)"""
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    group = await db.coop_groups.find_one({"group_id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if requester is owner or admin
    member = next((m for m in group.get("members", []) if m["family_id"] == my_profile["family_id"]), None)
    if not member or member.get("role") not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can reject requests")
    
    await db.coop_groups.update_one(
        {"group_id": group_id},
        {"$pull": {"join_requests": {"family_id": family_id}}}
    )
    
    return {"message": "Join request rejected"}

# ============ SUBSCRIPTION ENDPOINTS ============

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/subscription/checkout")
async def create_subscription_checkout(
    request: Request,
    plan: str,
    user: dict = Depends(get_current_user)
):
    if plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan_details = SUBSCRIPTION_PLANS[plan]
    host_url = str(request.base_url).rstrip("/")
    
    # Get origin from frontend
    origin = request.headers.get("Origin", host_url)
    
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(plan_details["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan": plan,
            "plan_name": plan_details["name"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "amount": plan_details["price"],
        "currency": "usd",
        "plan": plan,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscription/status/{session_id}")
async def check_subscription_status(session_id: str, user: dict = Depends(get_current_user)):
    host_url = "https://example.com"  # Not used for status check
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn.get("payment_status") != "paid" and status.payment_status == "paid":
            plan = txn.get("plan", "monthly")
            plan_details = SUBSCRIPTION_PLANS.get(plan, SUBSCRIPTION_PLANS["monthly"])
            
            subscription_ends = datetime.now(timezone.utc) + timedelta(days=plan_details["duration_days"])
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": status.payment_status,
                    "status": status.status
                }}
            )
            
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {
                    "subscription_status": "active",
                    "subscription_ends_at": subscription_ends.isoformat(),
                    "subscription_plan": plan
                }}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error checking subscription status: {e}")
        raise HTTPException(status_code=400, detail="Error checking payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            user_id = webhook_response.metadata.get("user_id")
            plan = webhook_response.metadata.get("plan", "monthly")
            
            if user_id:
                plan_details = SUBSCRIPTION_PLANS.get(plan, SUBSCRIPTION_PLANS["monthly"])
                subscription_ends = datetime.now(timezone.utc) + timedelta(days=plan_details["duration_days"])
                
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "subscription_status": "active",
                        "subscription_ends_at": subscription_ends.isoformat(),
                        "subscription_plan": plan
                    }}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============ ID VERIFICATION ENDPOINT ============

@api_router.post("/verification/submit-id")
async def submit_id_verification(user: dict = Depends(get_current_user)):
    # In production, this would integrate with an ID verification service
    # For now, we'll create a pending verification request
    verification_id = f"verify_{uuid.uuid4().hex[:12]}"
    
    await db.id_verifications.insert_one({
        "verification_id": verification_id,
        "user_id": user["user_id"],
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "verification_id": verification_id,
        "status": "pending",
        "message": "ID verification submitted. You will be notified once reviewed."
    }

@api_router.get("/verification/status")
async def get_verification_status(user: dict = Depends(get_current_user)):
    verification = await db.id_verifications.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    return {
        "email_verified": user.get("email_verified", False),
        "id_verified": user.get("id_verified", False),
        "verification_request": verification
    }

# ============ CALENDAR ENDPOINTS ============

@api_router.get("/calendar/events")
async def get_calendar_events(
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    my_profile = await db.family_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not my_profile:
        return []
    
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year
    
    start_date = f"{target_year}-{target_month:02d}-01"
    if target_month == 12:
        end_date = f"{target_year + 1}-01-01"
    else:
        end_date = f"{target_year}-{target_month + 1:02d}-01"
    
    events = await db.events.find(
        {
            "$or": [
                {"host_family_id": my_profile["family_id"]},
                {"attendees.family_id": my_profile["family_id"]}
            ],
            "event_date": {"$gte": start_date, "$lt": end_date}
        },
        {"_id": 0}
    ).to_list(100)
    
    return events

# ============ PUSH NOTIFICATION ENDPOINTS ============

@api_router.get("/notifications/vapid-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="Push notifications not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/notifications/subscribe")
async def subscribe_to_push(subscription: PushSubscription, user: dict = Depends(get_current_user)):
    """Subscribe to push notifications"""
    # Check if subscription already exists
    existing = await db.push_subscriptions.find_one({
        "user_id": user["user_id"],
        "endpoint": subscription.endpoint
    })
    
    if existing:
        return {"status": "already_subscribed"}
    
    # Store subscription
    await db.push_subscriptions.insert_one({
        "user_id": user["user_id"],
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"status": "subscribed"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_from_push(subscription: PushSubscription, user: dict = Depends(get_current_user)):
    """Unsubscribe from push notifications"""
    result = await db.push_subscriptions.delete_one({
        "user_id": user["user_id"],
        "endpoint": subscription.endpoint
    })
    
    return {"status": "unsubscribed", "deleted": result.deleted_count > 0}

@api_router.get("/notifications/preferences")
async def get_notification_preferences(user: dict = Depends(get_current_user)):
    """Get user's notification preferences"""
    prefs = user.get("notification_preferences", {
        "messages": True,
        "events": True,
        "meetup_requests": True,
        "group_updates": True
    })
    
    # Check if user has any push subscriptions
    sub_count = await db.push_subscriptions.count_documents({"user_id": user["user_id"]})
    
    return {
        "preferences": prefs,
        "push_enabled": sub_count > 0
    }

@api_router.put("/notifications/preferences")
async def update_notification_preferences(prefs: NotificationPreferences, user: dict = Depends(get_current_user)):
    """Update user's notification preferences"""
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"notification_preferences": prefs.dict()}}
    )
    
    return {"status": "updated", "preferences": prefs.dict()}

@api_router.post("/notifications/test")
async def send_test_notification(user: dict = Depends(get_current_user)):
    """Send a test push notification"""
    await send_push_notification(
        user_id=user["user_id"],
        title="Test Notification",
        body="Push notifications are working! 🎉",
        url="/settings"
    )
    return {"status": "sent"}

# ============ ROOT ENDPOINT ============

@api_router.get("/")
async def root():
    return {"message": "Village Friends API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
