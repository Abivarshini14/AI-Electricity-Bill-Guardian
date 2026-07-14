from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.models import User, UserProfile, UserRole
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        role=user.role.value,
        profile_completed=user.profile_completed,
        name=user.name,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        role=user.role.value,
        profile_completed=user.profile_completed,
        name=user.name,
        user_id=user.id,
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "profile_completed": current_user.profile_completed,
    }
