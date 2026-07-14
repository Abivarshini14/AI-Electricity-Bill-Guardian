import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_current_admin, get_owned_property
from app.core.config import settings
from app.models.models import Complaint, ComplaintCategory, ComplaintStatus, User
from app.schemas.schemas import ComplaintResponse, ComplaintStatusUpdateRequest
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

ATTACHMENT_DIR = os.path.join(settings.UPLOAD_DIR, "complaints")
os.makedirs(ATTACHMENT_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE = 8 * 1024 * 1024

# Status transitions allowed for admin updates (deterministic workflow, not free-form)
VALID_STATUS_FLOW = {
    ComplaintStatus.SUBMITTED: {ComplaintStatus.UNDER_REVIEW, ComplaintStatus.CLOSED},
    ComplaintStatus.UNDER_REVIEW: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.CLOSED},
    ComplaintStatus.IN_PROGRESS: {ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED},
    ComplaintStatus.RESOLVED: {ComplaintStatus.CLOSED},
    ComplaintStatus.CLOSED: set(),
}


def _validate_category(value: str) -> ComplaintCategory:
    try:
        return ComplaintCategory(value)
    except ValueError:
        valid = ", ".join([c.value for c in ComplaintCategory])
        raise HTTPException(status_code=400, detail=f"Invalid complaint category. Must be one of: {valid}")


# ---------- User: raise complaint (with optional attachment) ----------
@router.post("", response_model=ComplaintResponse)
async def raise_complaint(
    property_id: int = Form(...),
    category: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = get_owned_property(property_id, db, current_user)
    cat = _validate_category(category)

    if not subject.strip() or not description.strip():
        raise HTTPException(status_code=400, detail="Subject and description are required")

    attachment_url = None
    if file is not None and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only jpg, jpeg, png, webp, or pdf files are allowed")
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 8MB")
        filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(ATTACHMENT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        attachment_url = f"/uploads/complaints/{filename}"

    complaint = Complaint(
        user_id=current_user.id,
        property_id=prop.id,
        category=cat,
        subject=subject.strip(),
        description=description.strip(),
        attachment_url=attachment_url,
        status=ComplaintStatus.SUBMITTED,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    create_notification(
        db, current_user, "COMPLAINT_SUBMITTED", "Complaint Submitted",
        f"Your complaint '{complaint.subject}' for '{prop.name}' has been submitted and is awaiting review.",
        property_id=prop.id,
    )

    return complaint


# ---------- User: track complaints ----------
@router.get("", response_model=list[ComplaintResponse])
def list_my_complaints(
    property_id: int = None,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint).filter(Complaint.user_id == current_user.id)
    if property_id:
        query = query.filter(Complaint.property_id == property_id)
    if status:
        try:
            status_enum = ComplaintStatus(status)
            query = query.filter(Complaint.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    return query.order_by(Complaint.created_at.desc()).all()


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="You do not have access to this complaint")
    return complaint


# ---------- Admin: manage complaints ----------
@router.get("/admin/all", response_model=list[ComplaintResponse])
def admin_list_complaints(
    status: str = None,
    category: str = None,
    search: str = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    if status:
        try:
            query = query.filter(Complaint.status == ComplaintStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    if category:
        try:
            query = query.filter(Complaint.category == ComplaintCategory(category))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category filter")
    if search:
        like = f"%{search}%"
        query = query.filter((Complaint.subject.ilike(like)) | (Complaint.description.ilike(like)))
    return query.order_by(Complaint.created_at.desc()).all()


@router.get("/admin/stats")
def admin_complaint_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    stats = {"total": total}
    for status in ComplaintStatus:
        stats[status.value] = db.query(Complaint).filter(Complaint.status == status).count()
    return stats


@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    try:
        new_status = ComplaintStatus(payload.status)
    except ValueError:
        valid = ", ".join([s.value for s in ComplaintStatus])
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")

    if new_status != complaint.status and new_status not in VALID_STATUS_FLOW.get(complaint.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move complaint from '{complaint.status.value}' to '{new_status.value}'",
        )

    complaint.status = new_status
    if payload.admin_response is not None:
        complaint.admin_response = payload.admin_response.strip()
    db.commit()
    db.refresh(complaint)

    complaint_user = db.query(User).filter(User.id == complaint.user_id).first()
    if complaint_user:
        create_notification(
            db, complaint_user, "COMPLAINT_UPDATE", "Complaint Status Updated",
            f"Your complaint '{complaint.subject}' status changed to '{new_status.value}'."
            + (f" Admin response: {complaint.admin_response}" if complaint.admin_response else ""),
            property_id=complaint.property_id, send_mail=True,
        )

    return complaint
