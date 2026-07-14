from sqlalchemy.orm import Session

from app.models.models import Notification, User
from app.services.email_service import send_email


def create_notification(db: Session, user: User, ntype: str, title: str, message: str,
                         property_id: int = None, send_mail: bool = False) -> Notification:
    note = Notification(
        user_id=user.id,
        property_id=property_id,
        type=ntype,
        title=title,
        message=message,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    if send_mail:
        try:
            send_email(user.email, title, message)
        except Exception:
            pass

    return note
