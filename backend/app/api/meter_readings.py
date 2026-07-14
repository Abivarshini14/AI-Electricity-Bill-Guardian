from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import MeterReading, Notification
from app.schemas.schemas import MeterReadingCreateRequest, MeterReadingResponse
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/meter-readings", tags=["Meter Readings"])

# Deterministic alert threshold: if new reading implies > 3x the average of last 3 readings
HIGH_USAGE_MULTIPLIER = 2.5


@router.post("", response_model=MeterReadingResponse)
def add_reading(payload: MeterReadingCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)

    if payload.current_reading < payload.previous_reading:
        raise HTTPException(status_code=400, detail="Current reading must be greater than or equal to previous reading")

    units = payload.current_reading - payload.previous_reading

    reading = MeterReading(
        property_id=prop.id,
        previous_reading=payload.previous_reading,
        current_reading=payload.current_reading,
        units_consumed=units,
        reading_date=payload.reading_date,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    history = (
        db.query(MeterReading)
        .filter(MeterReading.property_id == prop.id, MeterReading.id != reading.id)
        .order_by(MeterReading.reading_date.desc())
        .limit(3)
        .all()
    )
    if history:
        avg_units = sum(r.units_consumed for r in history) / len(history)
        if avg_units > 0 and units > avg_units * HIGH_USAGE_MULTIPLIER:
            create_notification(
                db, current_user, "HIGH_USAGE",
                "Unusual Electricity Usage Detected",
                f"Your latest reading for '{prop.name}' shows {units} units, which is significantly higher "
                f"than your recent average of {round(avg_units, 1)} units. Please check your water heater, "
                f"AC, water motor, refrigerator, and wiring. Contact a qualified electrician if you suspect a fault.",
                property_id=prop.id,
            )

    return reading


@router.get("", response_model=list[MeterReadingResponse])
def list_readings(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    return (
        db.query(MeterReading)
        .filter(MeterReading.property_id == property_id)
        .order_by(MeterReading.reading_date.desc())
        .all()
    )
