from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Appliance, ApplianceSchedule, TariffSlab
from app.schemas.schemas import ApplianceCreateRequest, ApplianceResponse
from app.services.billing_service import calculate_appliance_consumption, get_applicable_tariff_slabs, calculate_slab_wise_bill

router = APIRouter(prefix="/api/appliances", tags=["Appliances"])

DEFAULT_APPLIANCES = [
    "Fan", "Air Conditioner", "Refrigerator", "Television", "Washing Machine",
    "Water Heater", "Water Pump / Motor", "Lights", "Computer", "Microwave",
    "Shop Equipment", "Office Equipment",
]


@router.get("/defaults")
def get_default_appliances():
    return {"appliances": DEFAULT_APPLIANCES}


def _enrich(appliance: Appliance, rate_per_unit: float) -> ApplianceResponse:
    calc = calculate_appliance_consumption(appliance)
    cost = round(calc["two_month_units"] * rate_per_unit, 2)
    return ApplianceResponse(
        id=appliance.id,
        property_id=appliance.property_id,
        name=appliance.name,
        quantity=appliance.quantity,
        wattage=appliance.wattage,
        daily_usage_hours=appliance.daily_usage_hours,
        standby_wattage=appliance.standby_wattage,
        standby_hours=appliance.standby_hours,
        daily_units=calc["daily_units"],
        monthly_units=calc["monthly_units"],
        two_month_units=calc["two_month_units"],
        estimated_cost=cost,
        standby_units=calc["standby_units"],
    )


def _avg_rate(db: Session, prop) -> float:
    slabs = get_applicable_tariff_slabs(db, prop.area_category.value, prop.property_type.value)
    if not slabs:
        return 6.0
    return sum(s.rate_per_unit for s in slabs) / len(slabs)


@router.get("", response_model=list[ApplianceResponse])
def list_appliances(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    rate = _avg_rate(db, prop)
    appliances = db.query(Appliance).filter(Appliance.property_id == property_id).all()
    enriched = [_enrich(a, rate) for a in appliances]
    enriched.sort(key=lambda x: x.two_month_units, reverse=True)
    return enriched


@router.post("", response_model=ApplianceResponse)
def add_appliance(payload: ApplianceCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    if payload.wattage <= 0:
        raise HTTPException(status_code=400, detail="Wattage must be greater than 0")

    appliance = Appliance(
        property_id=prop.id,
        name=payload.name.strip(),
        quantity=max(payload.quantity, 1),
        wattage=payload.wattage,
        daily_usage_hours=max(payload.daily_usage_hours, 0),
        standby_wattage=max(payload.standby_wattage, 0),
        standby_hours=max(payload.standby_hours, 0),
    )
    db.add(appliance)
    db.commit()
    db.refresh(appliance)

    rate = _avg_rate(db, prop)
    return _enrich(appliance, rate)


@router.delete("/{appliance_id}")
def delete_appliance(appliance_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    appliance = db.query(Appliance).filter(Appliance.id == appliance_id).first()
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    get_owned_property(appliance.property_id, db, current_user)
    db.delete(appliance)
    db.commit()
    return {"detail": "Appliance deleted"}


@router.post("/simulate")
def simulate_whatif(property_id: int, quantity: int, wattage: float, daily_usage_hours: float,
                     current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """What-if savings simulator. Does not persist any change."""
    prop = get_owned_property(property_id, db, current_user)
    rate = _avg_rate(db, prop)
    fake = Appliance(property_id=prop.id, name="simulated", quantity=quantity, wattage=wattage,
                      daily_usage_hours=daily_usage_hours, standby_wattage=0, standby_hours=0)
    calc = calculate_appliance_consumption(fake)
    cost = round(calc["two_month_units"] * rate, 2)
    return {"two_month_units": calc["two_month_units"], "estimated_cost": cost}
