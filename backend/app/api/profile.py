import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.models import User, UserProfile
from app.schemas.schemas import ProfileUpdateRequest, ProfileResponse

router = APIRouter(prefix="/api/profile", tags=["Profile"])

PHOTO_DIR = os.path.join(settings.UPLOAD_DIR, "profile_photos")
os.makedirs(PHOTO_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return ProfileResponse(
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        photo_url=profile.photo_url if profile else None,
        address=profile.address if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        country=profile.country if profile else None,
        pincode=profile.pincode if profile else None,
        language=profile.language if profile else "en",
        profile_completed=current_user.profile_completed,
    )


@router.put("", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.name:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.address is not None:
        profile.address = payload.address
    if payload.city is not None:
        profile.city = payload.city
    if payload.state is not None:
        profile.state = payload.state
    if payload.country is not None:
        profile.country = payload.country
    if payload.pincode is not None:
        profile.pincode = payload.pincode
    if payload.language:
        profile.language = payload.language

    if profile.address and profile.city and profile.state and profile.pincode:
        current_user.profile_completed = True

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return ProfileResponse(
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        photo_url=profile.photo_url,
        address=profile.address,
        city=profile.city,
        state=profile.state,
        country=profile.country,
        pincode=profile.pincode,
        language=profile.language,
        profile_completed=current_user.profile_completed,
    )


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only jpg, jpeg, png, webp images are allowed")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")

    filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(PHOTO_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    profile.photo_url = f"/uploads/profile_photos/{filename}"
    db.commit()

    return {"photo_url": profile.photo_url}
