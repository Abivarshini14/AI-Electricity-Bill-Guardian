from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Appliance, ApplianceSchedule

router = APIRouter(prefix="/api/appliance-schedules", tags=["Appliance Planner"])


class ScheduleCreateRequest(BaseModel):
    appliance_id: int
    start_time: str
    end_time: str
    days_of_week: list[str]


def _hours_between(start_time: str, end_time: str) -> float:
    fmt = "%H:%M"
    start = datetime.strptime(start_time, fmt)
    end = datetime.strptime(end_time, fmt)
    diff = (end - start).total_seconds() / 3600
    if diff < 0:
        diff += 24
    return round(diff, 2)


@router.post("")
def create_schedule(payload: ScheduleCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    appliance = db.query(Appliance).filter(Appliance.id == payload.appliance_id).first()
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    get_owned_property(appliance.property_id, db, current_user)

    hours_per_day = _hours_between(payload.start_time, payload.end_time)
    days_count = len(payload.days_of_week)
    expected_daily_units = round((appliance.quantity * appliance.wattage * hours_per_day) / 1000.0, 3)
    weekly_units = round(expected_daily_units * days_count, 2)

    schedule = ApplianceSchedule(
        appliance_id=appliance.id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        days_of_week=",".join(payload.days_of_week),
        expected_daily_units=expected_daily_units,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "id": schedule.id,
        "expected_daily_units": expected_daily_units,
        "expected_weekly_units": weekly_units,
        "hours_per_day": hours_per_day,
    }


@router.get("")
def list_schedules(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    appliance_ids = [a.id for a in db.query(Appliance).filter(Appliance.property_id == property_id).all()]
    schedules = db.query(ApplianceSchedule).filter(ApplianceSchedule.appliance_id.in_(appliance_ids)).all()
    return [
        {"id": s.id, "appliance_id": s.appliance_id, "start_time": s.start_time, "end_time": s.end_time,
         "days_of_week": s.days_of_week.split(","), "expected_daily_units": s.expected_daily_units}
        for s in schedules
    ]
