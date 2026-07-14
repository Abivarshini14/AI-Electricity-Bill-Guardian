"""
Combined router for: Energy Challenges, Energy Streaks, Away Mode, and Outage Logs.
These features follow the same ownership-checked, deterministic-calculation pattern
used throughout the rest of the API.
"""
import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import (
    EnergyChallenge, EnergyStreak, AwayMode, OutageLog, MeterReading,
)
from app.schemas.schemas import ChallengeCreateRequest, AwayModeCreateRequest, OutageCreateRequest

router = APIRouter(prefix="/api", tags=["Challenges, Streaks, Away Mode, Outages"])

DEFAULT_AWAY_CHECKLIST = [
    "Switch off unnecessary lights",
    "Check water heater is switched off",
    "Check AC is switched off",
    "Unplug optional devices",
    "Review standby appliances",
]


@router.post("/challenges")
def create_challenge(payload: ChallengeCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    challenge = EnergyChallenge(
        property_id=prop.id, name=payload.name, target_type=payload.target_type,
        target_value=payload.target_value, start_date=payload.start_date, end_date=payload.end_date,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return {"id": challenge.id, "name": challenge.name}


@router.get("/challenges")
def list_challenges(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    challenges = db.query(EnergyChallenge).filter(EnergyChallenge.property_id == property_id).all()
    result = []
    for c in challenges:
        readings = db.query(MeterReading).filter(
            MeterReading.property_id == property_id,
            MeterReading.reading_date >= c.start_date, MeterReading.reading_date <= c.end_date,
        ).all()
        units_used = sum(r.units_consumed for r in readings)
        progress = 0
        if c.target_type == "units" and c.target_value:
            progress = round(max(0, (1 - (units_used / c.target_value))) * 100, 1)
        result.append({
            "id": c.id, "name": c.name, "target_type": c.target_type, "target_value": c.target_value,
            "units_used": units_used, "progress_percent": min(progress, 100), "badge_awarded": c.badge_awarded,
        })
    return result


@router.get("/streaks")
def get_streak(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    streak = db.query(EnergyStreak).filter(EnergyStreak.property_id == property_id).first()
    if not streak:
        streak = EnergyStreak(property_id=property_id, current_streak_weeks=0, best_streak_weeks=0)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    return {"current_streak_weeks": streak.current_streak_weeks, "best_streak_weeks": streak.best_streak_weeks}


@router.post("/away-mode")
def create_away_mode(payload: AwayModeCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    away = AwayMode(
        property_id=prop.id, start_date=payload.start_date, end_date=payload.end_date,
        checklist_json=json.dumps(DEFAULT_AWAY_CHECKLIST),
    )
    db.add(away)
    db.commit()
    db.refresh(away)
    return {"id": away.id, "checklist": DEFAULT_AWAY_CHECKLIST, "start_date": away.start_date, "end_date": away.end_date}


@router.get("/away-mode")
def list_away_mode(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    periods = db.query(AwayMode).filter(AwayMode.property_id == property_id).order_by(AwayMode.start_date.desc()).all()
    return [{"id": a.id, "start_date": a.start_date, "end_date": a.end_date, "checklist": json.loads(a.checklist_json or "[]")} for a in periods]


@router.post("/outages")
def log_outage(payload: OutageCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    duration = round((payload.end_time - payload.start_time).total_seconds() / 3600, 2)
    outage = OutageLog(
        property_id=prop.id, start_time=payload.start_time, end_time=payload.end_time,
        duration_hours=duration, notes=payload.notes,
    )
    db.add(outage)
    db.commit()
    db.refresh(outage)
    return {"id": outage.id, "duration_hours": duration}


@router.get("/outages")
def list_outages(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    outages = db.query(OutageLog).filter(OutageLog.property_id == property_id).order_by(OutageLog.start_time.desc()).all()
    total_hours = sum(o.duration_hours for o in outages)
    return {
        "total_outage_hours": round(total_hours, 2),
        "outages": [
            {"id": o.id, "start_time": o.start_time, "end_time": o.end_time,
             "duration_hours": o.duration_hours, "notes": o.notes} for o in outages
        ],
    }
