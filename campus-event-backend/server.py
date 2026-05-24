import os
import asyncio
import html
import json
import urllib.error
import urllib.request
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Awaitable, Callable, Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from passlib.context import CryptContext
from pymongo import ReturnDocument
from pymongo.errors import ConfigurationError, PyMongoError, ServerSelectionTimeoutError
from pydantic import BaseModel, EmailStr, Field

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "EventApp")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM_EMAIL = os.getenv("EMAIL_FROM_EMAIL")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Gauhati University Event Manager")
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
EMAIL_NOTIFY_STUDENTS_ON_APPROVAL = os.getenv("EMAIL_NOTIFY_STUDENTS_ON_APPROVAL", "true").lower() == "true"
EMAIL_MAX_RECIPIENTS_PER_EVENT = int(os.getenv("EMAIL_MAX_RECIPIENTS_PER_EVENT", "250"))

if not MONGO_URL:
    raise RuntimeError("MONGO_URL is required")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is required")

client: AsyncIOMotorClient
db: AsyncIOMotorDatabase
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_database()
    await initialize_database()
    try:
        yield
    finally:
        client.close()


app = FastAPI(title="Campus Event Management API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def connect_database() -> None:
    global client, db

    try:
        client = AsyncIOMotorClient(
            MONGO_URL,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
            socketTimeoutMS=8000,
        )
        db = client[DB_NAME]
        await client.admin.command("ping")
    except (ConfigurationError, ServerSelectionTimeoutError, PyMongoError, TimeoutError) as exc:
        raise RuntimeError(
            "Cannot connect to MongoDB Atlas. Check Atlas Network Access IP allowlist, "
            "your internet/DNS connection, and whether port 27017 is blocked by firewall or network. "
            "If using mongodb+srv, DNS SRV/TXT lookup must work."
        ) from exc


class UserRole(str, Enum):
    student = "student"
    admin = "admin"
    registrar = "registrar"


class EventStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    live = "live"
    completed = "completed"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    department: str = Field(min_length=2, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: str
    role: UserRole
    created_at: datetime


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=5, max_length=1000)
    date: datetime
    venue: str = Field(min_length=2, max_length=120)
    department: str = Field(min_length=2, max_length=80)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, min_length=5, max_length=1000)
    date: Optional[datetime] = None
    venue: Optional[str] = Field(default=None, min_length=2, max_length=120)
    department: Optional[str] = Field(default=None, min_length=2, max_length=80)


class RejectRequest(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    date: datetime
    venue: str
    department: str
    status: EventStatus
    created_by: str
    created_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    id: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    user_id: str


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def oid(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail="Invalid id")
    return ObjectId(value)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str) -> str:
    expires = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)


def serialize_user(doc: dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        department=doc["department"],
        role=doc["role"],
        created_at=doc["created_at"],
    )


def serialize_event(doc: dict[str, Any]) -> EventResponse:
    return EventResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc["description"],
        date=doc["date"],
        venue=doc["venue"],
        department=doc["department"],
        status=doc["status"],
        created_by=str(doc["created_by"]),
        created_by_name=doc.get("created_by_name"),
        rejection_reason=doc.get("rejection_reason"),
        created_at=doc["created_at"],
        updated_at=doc.get("updated_at"),
    )


def serialize_notification(doc: dict[str, Any]) -> NotificationResponse:
    return NotificationResponse(
        id=str(doc["_id"]),
        message=doc["message"],
        type=doc["type"],
        is_read=doc["is_read"],
        created_at=doc["created_at"],
        user_id=str(doc["user_id"]),
    )


async def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await db.users.find_one({"_id": oid(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*roles: UserRole) -> Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]:
    async def dependency(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
        if user["role"] not in [role.value for role in roles]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def email_configured() -> bool:
    return bool(EMAIL_ENABLED and BREVO_API_KEY and EMAIL_FROM_EMAIL)


def plain_text_to_html(text: str) -> str:
    return f"<p>{html.escape(text).replace(chr(10), '<br />')}</p>"


def send_brevo_email_sync(to_email: str, to_name: str, subject: str, body: str) -> None:
    if not email_configured():
        return

    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM_EMAIL},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": plain_text_to_html(body),
    }
    request = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"Email notification failed for {to_email}: {exc}")


async def send_email_notification(user: dict[str, Any], subject: str, body: str) -> None:
    await asyncio.to_thread(send_brevo_email_sync, user["email"], user["name"], subject, body)


async def create_notification(
    user_id: ObjectId,
    message: str,
    notification_type: str,
    email_subject: Optional[str] = None,
    email_body: Optional[str] = None,
) -> None:
    await db.notifications.insert_one(
        {
            "user_id": user_id,
            "message": message,
            "type": notification_type,
            "is_read": False,
            "created_at": now_utc(),
        }
    )
    if email_subject:
        user = await db.users.find_one({"_id": user_id})
        if user:
            await send_email_notification(user, email_subject, email_body or message)


async def notify_students_about_approved_event(event: dict[str, Any]) -> None:
    if not EMAIL_NOTIFY_STUDENTS_ON_APPROVAL:
        return

    subject = f"New approved event: {event['title']}"
    body = (
        f"A new Gauhati University event has been approved.\n\n"
        f"Event: {event['title']}\n"
        f"Department: {event['department']}\n"
        f"Venue: {event['venue']}\n"
        f"Date: {event['date']}\n\n"
        f"Open the Campus Event Manager app for full details."
    )
    message = f"New approved event: {event['title']} at {event['venue']}"
    cursor = db.users.find({"role": UserRole.student.value}).limit(max(0, EMAIL_MAX_RECIPIENTS_PER_EVENT))
    async for student in cursor:
        await create_notification(student["_id"], message, "event_approved_public", subject, body)


async def seed_departments() -> None:
    defaults = [
        "Arts",
        "Commerce and Management",
        "Law",
        "Medicine and Allied Health Science",
        "Science",
        "Technology",
        "Arabic",
        "Assamese",
        "Bengali",
        "Bodo",
        "Communication and Journalism",
        "Disabilities Studies",
        "Economics",
        "Education",
        "English",
        "English Language Teaching",
        "Folklore Studies",
        "Foreign Languages",
        "Hindi",
        "History",
        "Library and Information Science",
        "Linguistics",
        "Modern Indian Languages and Literary Studies",
        "Persian",
        "Philosophy",
        "Political Science",
        "Psychology",
        "Sanskrit",
        "Sociology",
        "Women's Studies",
        "Business Administration",
        "Commerce",
        "Anthropology",
        "Botany",
        "Chemistry",
        "Environmental Science",
        "Geography",
        "Geological Sciences",
        "Mathematics",
        "Physics",
        "Statistics",
        "Zoology",
        "Applied Sciences",
        "Bioengineering and Technology",
        "Biotechnology",
        "Computer Science",
        "Electronics and Communication Engineering",
        "Electronics and Communication Technology",
        "Information Technology",
        "Instrumentation and USIC",
    ]
    await db.departments.delete_many({"name": {"$nin": defaults}})
    for name in defaults:
        await db.departments.update_one({"name": name}, {"$setOnInsert": {"name": name}}, upsert=True)


async def seed_user(role: UserRole, email_env: str, password_env: str, default_name: str, default_email: str, default_password: str) -> None:
    email = os.getenv(email_env, default_email).lower()
    password = os.getenv(password_env, default_password)
    existing = await db.users.find_one({"email": email})
    if existing:
        return
    await db.users.insert_one(
        {
            "name": default_name,
            "email": email,
            "password_hash": hash_password(password),
            "department": "Administration",
            "role": role.value,
            "created_at": now_utc(),
        }
    )


async def initialize_database() -> None:
    await db.users.create_index("email", unique=True)
    await db.events.create_index("status")
    await db.events.create_index("created_by")
    await db.notifications.create_index("user_id")
    await db.departments.create_index("name", unique=True)
    await seed_departments()
    await seed_user(UserRole.admin, "ADMIN_EMAIL", "ADMIN_PASSWORD", "Campus Admin", "admin@test.com", "admin123")
    await seed_user(UserRole.registrar, "REGISTRAR_EMAIL", "REGISTRAR_PASSWORD", "Campus Registrar", "registrar@test.com", "registrar123")


@app.get("/")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "Campus Event Management API"}


@app.post("/auth/register", response_model=UserResponse, status_code=201)
async def register(payload: RegisterRequest) -> UserResponse:
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "department": payload.department,
        "role": UserRole.student.value,
        "created_at": now_utc(),
    }
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return serialize_user(user)


@app.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(user["_id"])))


@app.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict[str, Any] = Depends(current_user)) -> UserResponse:
    return serialize_user(user)


@app.get("/events", response_model=list[EventResponse])
async def get_events(_: dict[str, Any] = Depends(current_user)) -> list[EventResponse]:
    cursor = db.events.find({"status": {"$in": [EventStatus.approved.value, EventStatus.live.value]}}).sort("date", 1)
    return [serialize_event(doc) async for doc in cursor]


@app.post("/events", response_model=EventResponse, status_code=201)
async def create_event(payload: EventCreate, user: dict[str, Any] = Depends(require_roles(UserRole.admin))) -> EventResponse:
    event = {
        "title": payload.title,
        "description": payload.description,
        "date": payload.date,
        "venue": payload.venue,
        "department": payload.department,
        "status": EventStatus.pending.value,
        "created_by": user["_id"],
        "created_by_name": user["name"],
        "rejection_reason": None,
        "created_at": now_utc(),
        "updated_at": None,
    }
    result = await db.events.insert_one(event)
    event["_id"] = result.inserted_id
    registrars = db.users.find({"role": UserRole.registrar.value})
    async for registrar in registrars:
        await create_notification(
            registrar["_id"],
            f"New event pending approval: {payload.title}",
            "event_pending",
            f"Event pending approval: {payload.title}",
            (
                f"A new Gauhati University event is waiting for registrar approval.\n\n"
                f"Event: {payload.title}\n"
                f"Department: {payload.department}\n"
                f"Venue: {payload.venue}\n"
                f"Date: {payload.date}\n"
                f"Submitted by: {user['name']}\n\n"
                f"Open the Campus Event Manager app to approve or reject it."
            ),
        )
    return serialize_event(event)


@app.get("/events/live", response_model=list[EventResponse])
async def get_live_events(_: dict[str, Any] = Depends(current_user)) -> list[EventResponse]:
    start = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    cursor = db.events.find(
        {
            "$or": [
                {"status": EventStatus.live.value},
                {"status": EventStatus.approved.value, "date": {"$gte": start, "$lt": end}},
            ]
        }
    ).sort("date", 1)
    return [serialize_event(doc) async for doc in cursor]


@app.get("/events/pending", response_model=list[EventResponse])
async def get_pending_events(_: dict[str, Any] = Depends(require_roles(UserRole.registrar))) -> list[EventResponse]:
    cursor = db.events.find({"status": EventStatus.pending.value}).sort("created_at", -1)
    return [serialize_event(doc) async for doc in cursor]


@app.get("/events/my-events", response_model=list[EventResponse])
async def get_my_events(user: dict[str, Any] = Depends(require_roles(UserRole.admin, UserRole.registrar))) -> list[EventResponse]:
    if user["role"] == UserRole.registrar.value:
        cursor = db.events.find({"status": {"$in": [EventStatus.pending.value, EventStatus.approved.value, EventStatus.live.value]}}).sort("created_at", -1)
    else:
        cursor = db.events.find({"created_by": user["_id"]}).sort("created_at", -1)
    return [serialize_event(doc) async for doc in cursor]


@app.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, payload: EventUpdate, user: dict[str, Any] = Depends(require_roles(UserRole.admin))) -> EventResponse:
    event = await db.events.find_one({"_id": oid(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event["created_by"] != user["_id"]:
        raise HTTPException(status_code=403, detail="You can update only your own events")
    update = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
    update["updated_at"] = now_utc()
    result = await db.events.find_one_and_update({"_id": event["_id"]}, {"$set": update}, return_document=ReturnDocument.AFTER)
    return serialize_event(result)


@app.delete("/events/{event_id}")
async def delete_event(event_id: str, user: dict[str, Any] = Depends(require_roles(UserRole.admin))) -> dict[str, str]:
    result = await db.events.delete_one({"_id": oid(event_id), "created_by": user["_id"]})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Event not found or not owned by you")
    return {"message": "Event deleted"}


@app.put("/events/{event_id}/approve", response_model=EventResponse)
async def approve_event(event_id: str, user: dict[str, Any] = Depends(require_roles(UserRole.registrar))) -> EventResponse:
    event = await db.events.find_one({"_id": oid(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    result = await db.events.find_one_and_update(
        {"_id": event["_id"]},
        {"$set": {"status": EventStatus.approved.value, "rejection_reason": None, "updated_at": now_utc(), "approved_by": user["_id"]}},
        return_document=ReturnDocument.AFTER,
    )
    await create_notification(
        event["created_by"],
        f"Your event was approved: {event['title']}",
        "event_approved",
        f"Event approved: {event['title']}",
        (
            f"Your Gauhati University event has been approved.\n\n"
            f"Event: {event['title']}\n"
            f"Department: {event['department']}\n"
            f"Venue: {event['venue']}\n"
            f"Date: {event['date']}\n\n"
            f"It is now visible to students in the Campus Event Manager app."
        ),
    )
    await notify_students_about_approved_event(result)
    return serialize_event(result)


@app.put("/events/{event_id}/reject", response_model=EventResponse)
async def reject_event(event_id: str, payload: RejectRequest, user: dict[str, Any] = Depends(require_roles(UserRole.registrar))) -> EventResponse:
    event = await db.events.find_one({"_id": oid(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    rejection_reason = payload.reason.strip() if payload.reason and payload.reason.strip() else None
    result = await db.events.find_one_and_update(
        {"_id": event["_id"]},
        {"$set": {"status": EventStatus.rejected.value, "rejection_reason": rejection_reason, "updated_at": now_utc(), "rejected_by": user["_id"]}},
        return_document=ReturnDocument.AFTER,
    )
    message = f"Your event was rejected: {event['title']}"
    if rejection_reason:
        message = f"{message}. Remarks: {rejection_reason}"
    await create_notification(
        event["created_by"],
        message,
        "event_rejected",
        f"Event rejected: {event['title']}",
        (
            f"Your Gauhati University event was rejected by the registrar.\n\n"
            f"Event: {event['title']}\n"
            f"Department: {event['department']}\n"
            f"Venue: {event['venue']}\n"
            f"Date: {event['date']}\n"
            f"Remarks: {rejection_reason or 'No remarks provided.'}\n\n"
            f"You can review the rejected event in the Campus Event Manager app."
        ),
    )
    return serialize_event(result)


@app.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(user: dict[str, Any] = Depends(current_user)) -> list[NotificationResponse]:
    cursor = db.notifications.find({"user_id": user["_id"]}).sort("created_at", -1)
    return [serialize_notification(doc) async for doc in cursor]


@app.get("/notifications/unread-count")
async def get_unread_count(user: dict[str, Any] = Depends(current_user)) -> dict[str, int]:
    count = await db.notifications.count_documents({"user_id": user["_id"], "is_read": False})
    return {"count": count}


@app.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notification_id: str, user: dict[str, Any] = Depends(current_user)) -> NotificationResponse:
    result = await db.notifications.find_one_and_update(
        {"_id": oid(notification_id), "user_id": user["_id"]},
        {"$set": {"is_read": True}},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return serialize_notification(result)


@app.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict[str, Any] = Depends(current_user)) -> dict[str, int]:
    result = await db.notifications.update_many({"user_id": user["_id"], "is_read": False}, {"$set": {"is_read": True}})
    return {"updated": result.modified_count}


@app.get("/departments", response_model=list[str])
async def get_departments() -> list[str]:
    cursor = db.departments.find({}).sort("name", 1)
    return [doc["name"] async for doc in cursor]
