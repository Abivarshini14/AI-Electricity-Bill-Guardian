from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_admin
from app.models.models import (
    User, Property, Bill, Payment, PeakHourRule, AdminSetting, AILog, Notification, TariffSlab
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def list_users(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone, "role": u.role.value,
         "is_active": u.is_active, "profile_completed": u.profile_completed, "created_at": u.created_at}
        for u in users
    ]


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/properties")
def list_all_properties(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    props = db.query(Property).all()
    return [
        {"id": p.id, "name": p.name, "owner_id": p.owner_id, "property_type": p.property_type.value,
         "area_category": p.area_category.value, "formatted_address": p.formatted_address}
        for p in props
    ]


@router.get("/bills")
def list_all_bills(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    bills = db.query(Bill).order_by(Bill.created_at.desc()).limit(200).all()
    return [
        {"id": b.id, "property_id": b.property_id, "total_amount": b.total_amount,
         "status": b.status.value, "due_date": b.due_date, "units_consumed": b.units_consumed}
        for b in bills
    ]


@router.get("/payments")
def list_all_payments(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(200).all()
    return [
        {"id": p.id, "bill_id": p.bill_id, "amount": p.amount, "method": p.method,
         "status": p.status.value, "reference_id": p.reference_id, "paid_at": p.paid_at}
        for p in payments
    ]


@router.get("/ai-logs")
def list_ai_logs(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(AILog).order_by(AILog.created_at.desc()).limit(200).all()
    return [
        {"id": l.id, "user_id": l.user_id, "endpoint": l.endpoint, "used_fallback": l.used_fallback,
         "success": l.success, "created_at": l.created_at}
        for l in logs
    ]


@router.get("/alerts")
def list_alerts(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    alerts = db.query(Notification).filter(
        Notification.type.in_(["HIGH_USAGE", "BUDGET_ALERT", "BILL_SHOCK"])
    ).order_by(Notification.created_at.desc()).limit(200).all()
    return [
        {"id": a.id, "user_id": a.user_id, "type": a.type, "title": a.title,
         "message": a.message, "created_at": a.created_at}
        for a in alerts
    ]


# ---------- Peak hour rules ----------
@router.get("/peak-hours")
def list_peak_hours(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    rules = db.query(PeakHourRule).all()
    return [
        {"id": r.id, "start_time": r.start_time, "end_time": r.end_time,
         "description": r.description, "tou_rate_multiplier": r.tou_rate_multiplier, "is_active": r.is_active}
        for r in rules
    ]


@router.post("/peak-hours")
def create_peak_hour(start_time: str, end_time: str, description: str = "", tou_rate_multiplier: float = None,
                      admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = PeakHourRule(start_time=start_time, end_time=end_time, description=description, tou_rate_multiplier=tou_rate_multiplier)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"id": rule.id}


# ---------- Admin settings (alert thresholds etc.) ----------
@router.get("/settings")
def list_settings(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    settings_rows = db.query(AdminSetting).all()
    return {s.key: s.value for s in settings_rows}


@router.put("/settings/{key}")
def update_setting(key: str, value: str, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        setting = AdminSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
    db.commit()
    return {"key": key, "value": value}


@router.get("/analytics")
def admin_analytics(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_properties = db.query(Property).count()
    total_bills = db.query(Bill).count()
    total_revenue = db.query(Payment).filter(Payment.status == "Paid").count()
    total_tariffs = db.query(TariffSlab).filter(TariffSlab.is_active == True).count()  # noqa: E712
    return {
        "total_users": total_users,
        "total_properties": total_properties,
        "total_bills": total_bills,
        "total_paid_payments": total_revenue,
        "active_tariff_slabs": total_tariffs,
    }
