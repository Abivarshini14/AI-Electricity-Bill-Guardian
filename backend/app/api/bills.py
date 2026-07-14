from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Bill, BillingCycle, MeterReading, BillStatus
from app.schemas.schemas import BillResponse
from app.services.billing_service import get_applicable_tariff_slabs, calculate_slab_wise_bill
from app.services.pdf_service import generate_bill_pdf
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/bills", tags=["Bills"])


@router.post("/generate/{property_id}", response_model=BillResponse)
def generate_bill(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    cycle = db.query(BillingCycle).filter(BillingCycle.property_id == prop.id).first()
    if not cycle:
        raise HTTPException(status_code=400, detail="Billing cycle not configured for this property")

    readings = (
        db.query(MeterReading)
        .filter(MeterReading.property_id == prop.id, MeterReading.reading_date >= cycle.cycle_start)
        .all()
    )
    units = sum(r.units_consumed for r in readings)
    if units <= 0:
        raise HTTPException(status_code=400, detail="No meter readings found for the current billing cycle")

    slabs = get_applicable_tariff_slabs(db, prop.area_category.value, prop.property_type.value)
    calc = calculate_slab_wise_bill(units, slabs)

    bill = Bill(
        property_id=prop.id,
        cycle_start=cycle.cycle_start,
        cycle_end=cycle.cycle_end,
        units_consumed=units,
        energy_charge=calc["energy_charge"],
        fixed_charge=calc["fixed_charge"],
        additional_charge=calc["additional_charge"],
        tax_amount=calc["tax_amount"],
        total_amount=calc["total_amount"],
        due_date=cycle.due_date,
        status=BillStatus.GENERATED,
        is_estimated=True,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    try:
        pdf_path = generate_bill_pdf(bill, prop, current_user)
        bill.pdf_path = pdf_path
        db.commit()
    except Exception:
        pass

    create_notification(
        db, current_user, "BILL_GENERATED", "Electricity Bill Generated",
        f"Your estimated bill for '{prop.name}' is Rs. {bill.total_amount} for {units} units. Due on {bill.due_date}.",
        property_id=prop.id, send_mail=True,
    )

    # roll billing cycle forward
    cycle.cycle_start = cycle.cycle_end
    cycle.cycle_end = cycle.cycle_end + timedelta(days=cycle.cycle_length_days)
    cycle.due_date = cycle.cycle_end + timedelta(days=15)
    db.commit()

    return bill


@router.get("", response_model=list[BillResponse])
def list_bills(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    return db.query(Bill).filter(Bill.property_id == property_id).order_by(Bill.created_at.desc()).all()


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    get_owned_property(bill.property_id, db, current_user)
    return bill


@router.get("/{bill_id}/pdf")
def download_bill_pdf(bill_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    prop = get_owned_property(bill.property_id, db, current_user)
    if not bill.pdf_path:
        bill.pdf_path = generate_bill_pdf(bill, prop, current_user)
        db.commit()
    return FileResponse(bill.pdf_path, filename=f"bill_{bill.id}.pdf", media_type="application/pdf")
