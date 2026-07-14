from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Bill, Appliance, Budget, SavingsGoal, EnergyChallenge
from app.services.billing_service import calculate_appliance_consumption
from app.services.pdf_service import generate_energy_report_pdf
from app.services.grok_service import ask_grok

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/energy-report/{property_id}")
async def generate_energy_report(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    bills = db.query(Bill).filter(Bill.property_id == prop.id).order_by(Bill.created_at.desc()).limit(2).all()
    if not bills:
        raise HTTPException(status_code=400, detail="No bills available yet to generate a report")

    latest_bill = bills[0]
    previous_bill = bills[1] if len(bills) > 1 else None

    appliances = db.query(Appliance).filter(Appliance.property_id == prop.id).all()
    ranked = sorted(appliances, key=lambda a: calculate_appliance_consumption(a)["two_month_units"], reverse=True)[:5]

    budget = db.query(Budget).filter(Budget.property_id == prop.id).order_by(Budget.created_at.desc()).first()
    goal = db.query(SavingsGoal).filter(SavingsGoal.property_id == prop.id).order_by(SavingsGoal.created_at.desc()).first()
    challenges = db.query(EnergyChallenge).filter(EnergyChallenge.property_id == prop.id).all()

    context = {
        "property_name": prop.name,
        "units_consumed": latest_bill.units_consumed,
        "total_amount": latest_bill.total_amount,
        "previous_bill_amount": previous_bill.total_amount if previous_bill else None,
        "budget": budget.amount if budget else None,
        "top_appliance": ranked[0].name if ranked else None,
    }
    ai_result = await ask_grok(
        "Generate a short two-month energy saving recommendation summary for this property.",
        context, "en",
    )

    report_data = {
        "User": current_user.name,
        "Property": f"{prop.name} - {prop.formatted_address}",
        "Billing Cycle": f"{latest_bill.cycle_start} to {latest_bill.cycle_end}",
        "Units Consumed": f"{latest_bill.units_consumed} kWh",
        "Bill Summary": f"Total: Rs. {latest_bill.total_amount} (Energy: Rs. {latest_bill.energy_charge}, "
                         f"Fixed: Rs. {latest_bill.fixed_charge}, Tax: Rs. {latest_bill.tax_amount})",
        "Previous Cycle Comparison": (
            f"Previous bill was Rs. {previous_bill.total_amount}" if previous_bill else "No previous bill on record"
        ),
        "Highest Usage Appliances": ", ".join([a.name for a in ranked]) if ranked else "No appliances recorded",
        "Budget Status": f"Rs. {budget.amount}" if budget else "No budget set",
        "Savings Goal Progress": f"{goal.title}: target Rs. {goal.target_amount}" if goal else "No savings goal set",
        "Challenge Progress": f"{len(challenges)} active challenge(s)" if challenges else "No active challenges",
        "AI Recommendations": ai_result["reply"],
    }

    path = generate_energy_report_pdf(report_data, f"{prop.id}_{latest_bill.id}")
    return FileResponse(path, filename=f"energy_report_{prop.id}.pdf", media_type="application/pdf")
