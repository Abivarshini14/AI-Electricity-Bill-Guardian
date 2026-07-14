from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Property, BillingCycle, PropertyType, PropertyCategory, AreaCategory
from app.schemas.schemas import PropertyCreateRequest, PropertyResponse
from app.services.billing_service import default_billing_cycle

router = APIRouter(prefix="/api/properties", tags=["Properties"])


def _validate_enum(value: str, enum_cls, field_name: str):
    try:
        return enum_cls(value)
    except ValueError:
        valid = ", ".join([e.value for e in enum_cls])
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}. Must be one of: {valid}")


@router.get("", response_model=list[PropertyResponse])
def list_properties(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Property).filter(Property.owner_id == current_user.id).order_by(Property.created_at.desc()).all()


@router.post("", response_model=PropertyResponse)
def create_property(payload: PropertyCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ptype = _validate_enum(payload.property_type, PropertyType, "property_type")
    pcat = _validate_enum(payload.property_category, PropertyCategory, "property_category")
    acat = _validate_enum(payload.area_category, AreaCategory, "area_category")

    if not payload.formatted_address or len(payload.formatted_address.strip()) < 5:
        raise HTTPException(status_code=400, detail="A confirmed address is required")

    prop = Property(
        owner_id=current_user.id,
        name=payload.name.strip(),
        property_type=ptype,
        property_category=pcat,
        area_category=acat,
        formatted_address=payload.formatted_address.strip(),
        consumer_number=payload.consumer_number,
        meter_number=payload.meter_number,
        electricity_board=payload.electricity_board,
        occupancy_count=payload.occupancy_count or 1,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    start, end, due = default_billing_cycle(length_days=payload.cycle_length_days or 60)
    cycle = BillingCycle(
        property_id=prop.id,
        cycle_length_days=payload.cycle_length_days or 60,
        cycle_start=start,
        cycle_end=end,
        due_date=due,
    )
    db.add(cycle)
    db.commit()

    return prop


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_owned_property(property_id, db, current_user)


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, payload: PropertyCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    prop.name = payload.name.strip()
    prop.property_type = _validate_enum(payload.property_type, PropertyType, "property_type")
    prop.property_category = _validate_enum(payload.property_category, PropertyCategory, "property_category")
    prop.area_category = _validate_enum(payload.area_category, AreaCategory, "area_category")
    prop.formatted_address = payload.formatted_address.strip()
    prop.consumer_number = payload.consumer_number
    prop.meter_number = payload.meter_number
    prop.electricity_board = payload.electricity_board
    prop.occupancy_count = payload.occupancy_count or 1
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}")
def delete_property(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    db.delete(prop)
    db.commit()
    return {"detail": "Property deleted"}


@router.get("/{property_id}/billing-cycle")
def get_billing_cycle(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    cycle = db.query(BillingCycle).filter(BillingCycle.property_id == prop.id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Billing cycle not configured")
    from datetime import date
    days_total = (cycle.cycle_end - cycle.cycle_start).days
    days_remaining = max((cycle.cycle_end - date.today()).days, 0)
    return {
        "cycle_start": cycle.cycle_start,
        "cycle_end": cycle.cycle_end,
        "due_date": cycle.due_date,
        "cycle_length_days": cycle.cycle_length_days,
        "days_total": days_total,
        "days_remaining": days_remaining,
        "progress_percent": round(((days_total - days_remaining) / days_total) * 100, 1) if days_total else 0,
    }
