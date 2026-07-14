from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_admin, get_current_user
from app.models.models import TariffSlab, AreaCategory, PropertyType
from app.schemas.schemas import TariffSlabCreateRequest, TariffSlabResponse

router = APIRouter(prefix="/api/tariffs", tags=["Tariffs"])


@router.get("", response_model=list[TariffSlabResponse])
def list_tariffs(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TariffSlab).filter(TariffSlab.is_active == True).all()  # noqa: E712


@router.post("", response_model=TariffSlabResponse)
def create_tariff(payload: TariffSlabCreateRequest, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    try:
        area = AreaCategory(payload.area_category)
        ptype = PropertyType(payload.property_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid area_category or property_type")

    slab = TariffSlab(
        area_category=area,
        property_type=ptype,
        min_unit=payload.min_unit,
        max_unit=payload.max_unit,
        rate_per_unit=payload.rate_per_unit,
        fixed_charge=payload.fixed_charge,
        additional_charge=payload.additional_charge,
        tax_percent=payload.tax_percent,
        effective_date=date.today(),
        label=payload.label or "Demo Tariff",
    )
    db.add(slab)
    db.commit()
    db.refresh(slab)
    return slab


@router.put("/{tariff_id}", response_model=TariffSlabResponse)
def update_tariff(tariff_id: int, payload: TariffSlabCreateRequest, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    slab = db.query(TariffSlab).filter(TariffSlab.id == tariff_id).first()
    if not slab:
        raise HTTPException(status_code=404, detail="Tariff not found")
    slab.area_category = AreaCategory(payload.area_category)
    slab.property_type = PropertyType(payload.property_type)
    slab.min_unit = payload.min_unit
    slab.max_unit = payload.max_unit
    slab.rate_per_unit = payload.rate_per_unit
    slab.fixed_charge = payload.fixed_charge
    slab.additional_charge = payload.additional_charge
    slab.tax_percent = payload.tax_percent
    slab.label = payload.label or slab.label
    db.commit()
    db.refresh(slab)
    return slab


@router.delete("/{tariff_id}")
def delete_tariff(tariff_id: int, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    slab = db.query(TariffSlab).filter(TariffSlab.id == tariff_id).first()
    if not slab:
        raise HTTPException(status_code=404, detail="Tariff not found")
    slab.is_active = False
    db.commit()
    return {"detail": "Tariff deactivated"}
