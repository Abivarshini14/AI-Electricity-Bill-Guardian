from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user
from app.models.models import Notification
from app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
        .all()
    )


@router.get("/unread-count")
def unread_count(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()  # noqa: E712
    return {"unread_count": count}


@router.put("/{notification_id}/read")
def mark_read(notification_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
    note.is_read = True
    db.commit()
    return {"detail": "Marked as read"}


@router.put("/read-all")
def mark_all_read(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"detail": "All notifications marked as read"}
