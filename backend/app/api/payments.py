import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Bill, Payment, PaymentStatus, BillStatus
from app.schemas.schemas import PaymentCreateRequest
from app.services.pdf_service import generate_receipt_pdf
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/payments", tags=["Payments"])

ALLOWED_METHODS = {"UPI", "Debit Card", "Credit Card", "Net Banking", "QR Payment"}


@router.post("")
def make_payment(payload: PaymentCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == payload.bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    prop = get_owned_property(bill.property_id, db, current_user)

    if bill.status == BillStatus.PAID:
        raise HTTPException(status_code=400, detail="This bill has already been paid")
    if payload.method not in ALLOWED_METHODS:
        raise HTTPException(status_code=400, detail=f"Invalid payment method. Allowed: {', '.join(ALLOWED_METHODS)}")

    # Simulated payment - no real card/UPI credentials are collected or stored.
    payment = Payment(
        bill_id=bill.id,
        amount=bill.total_amount,
        method=payload.method,
        status=PaymentStatus.PAID,
        reference_id=f"SIM-{uuid.uuid4().hex[:10].upper()}",
        paid_at=datetime.utcnow(),
    )
    db.add(payment)
    bill.status = BillStatus.PAID
    db.commit()
    db.refresh(payment)

    try:
        receipt_path = generate_receipt_pdf(payment, bill, prop, current_user)
        payment.receipt_pdf_path = receipt_path
        db.commit()
    except Exception:
        pass

    create_notification(
        db, current_user, "PAYMENT_SUCCESS", "Payment Successful",
        f"Your payment of Rs. {payment.amount} for '{prop.name}' was successful. Reference: {payment.reference_id}.",
        property_id=prop.id, send_mail=True,
    )

    return {
        "detail": "Payment successful (simulated)",
        "reference_id": payment.reference_id,
        "payment_id": payment.id,
        "status": payment.status.value,
    }


@router.get("")
def payment_history(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    bills = db.query(Bill).filter(Bill.property_id == property_id).all()
    bill_ids = [b.id for b in bills]
    payments = db.query(Payment).filter(Payment.bill_id.in_(bill_ids)).order_by(Payment.created_at.desc()).all()
    return [
        {
            "id": p.id, "bill_id": p.bill_id, "amount": p.amount, "method": p.method,
            "status": p.status.value, "reference_id": p.reference_id, "paid_at": p.paid_at,
        } for p in payments
    ]


@router.get("/{payment_id}/receipt")
def download_receipt(payment_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    bill = db.query(Bill).filter(Bill.id == payment.bill_id).first()
    get_owned_property(bill.property_id, db, current_user)
    if not payment.receipt_pdf_path:
        raise HTTPException(status_code=404, detail="Receipt not available")
    return FileResponse(payment.receipt_pdf_path, filename=f"receipt_{payment.id}.pdf", media_type="application/pdf")
