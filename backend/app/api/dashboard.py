from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import (
    Property, BillingCycle, MeterReading, Appliance, Bill, Budget, SavingsGoal, Notification
)
from app.services.billing_service import (
    get_applicable_tariff_slabs, calculate_slab_wise_bill, calculate_usage_pace,
    calculate_recommended_daily_limit, calculate_health_score, calculate_bill_shock,
    calculate_appliance_consumption,
)
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

BILL_SHOCK_THRESHOLD_PERCENT = 20.0


@router.get("/{property_id}/summary")
def dashboard_summary(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(property_id, db, current_user)
    cycle = db.query(BillingCycle).filter(BillingCycle.property_id == prop.id).first()
    if not cycle:
        raise HTTPException(status_code=400, detail="Billing cycle not configured")

    readings = db.query(MeterReading).filter(
        MeterReading.property_id == prop.id, MeterReading.reading_date >= cycle.cycle_start
    ).all()
    units_so_far = sum(r.units_consumed for r in readings)

    pace = calculate_usage_pace(cycle.cycle_start, cycle.cycle_end, units_so_far)

    slabs = get_applicable_tariff_slabs(db, prop.area_category.value, prop.property_type.value)
    projected_bill_calc = calculate_slab_wise_bill(pace["projected_cycle_usage"], slabs)
    estimated_bill = projected_bill_calc["total_amount"]

    budget = db.query(Budget).filter(Budget.property_id == prop.id).order_by(Budget.created_at.desc()).first()
    budget_amount = budget.amount if budget else None
    daily_limit = calculate_recommended_daily_limit(budget_amount, slabs, cycle.cycle_length_days) if budget_amount else None

    budget_status_ratio = (estimated_bill / budget_amount) if budget_amount else 1.0
    daily_limit_ratio = (pace["avg_daily_usage"] / daily_limit) if daily_limit else 1.0

    previous_bill = (
        db.query(Bill)
        .filter(Bill.property_id == prop.id)
        .order_by(Bill.created_at.desc())
        .first()
    )
    previous_bill_amount = previous_bill.total_amount if previous_bill else 0
    shock = calculate_bill_shock(estimated_bill, previous_bill_amount, BILL_SHOCK_THRESHOLD_PERCENT)

    appliances = db.query(Appliance).filter(Appliance.property_id == prop.id).all()
    standby_units_total = sum(calculate_appliance_consumption(a)["standby_units"] for a in appliances)
    standby_waste_ratio = min(standby_units_total / max(pace["projected_cycle_usage"], 1), 1.0)

    goal = db.query(SavingsGoal).filter(SavingsGoal.property_id == prop.id).order_by(SavingsGoal.created_at.desc()).first()
    savings_progress_ratio = 0.0
    if goal and budget_amount:
        estimated_savings = max(budget_amount - estimated_bill, 0)
        savings_progress_ratio = min(estimated_savings / goal.target_amount, 1.0) if goal.target_amount else 0

    consumption_increase_percent = shock["percent_change"]

    health = calculate_health_score(
        budget_status_ratio, daily_limit_ratio, consumption_increase_percent,
        standby_waste_ratio, savings_progress_ratio,
    )

    top_appliances = sorted(
        [{"name": a.name, **calculate_appliance_consumption(a)} for a in appliances],
        key=lambda x: x["two_month_units"], reverse=True,
    )[:5]

    if shock["is_shock"]:
        recent_shock_notif = db.query(Notification).filter(
            Notification.property_id == prop.id, Notification.type == "BILL_SHOCK"
        ).order_by(Notification.created_at.desc()).first()
        if not recent_shock_notif or (recent_shock_notif.created_at.date() != date.today()):
            create_notification(
                db, current_user, "BILL_SHOCK", "Bill Shock Alert",
                f"Your projected bill for '{prop.name}' is {shock['percent_change']}% higher than your previous cycle.",
                property_id=prop.id,
            )

    if budget_amount and estimated_bill > budget_amount:
        recent_budget_notif = db.query(Notification).filter(
            Notification.property_id == prop.id, Notification.type == "BUDGET_ALERT"
        ).order_by(Notification.created_at.desc()).first()
        if not recent_budget_notif or (recent_budget_notif.created_at.date() != date.today()):
            create_notification(
                db, current_user, "BUDGET_ALERT", "Budget Alert",
                f"Estimated bill for '{prop.name}' (Rs. {estimated_bill}) may exceed your budget (Rs. {budget_amount}) "
                f"by Rs. {round(estimated_bill - budget_amount, 2)}.",
                property_id=prop.id,
            )

    return {
        "property": {"id": prop.id, "name": prop.name},
        "billing_cycle": {
            "cycle_start": cycle.cycle_start, "cycle_end": cycle.cycle_end, "due_date": cycle.due_date,
        },
        "usage_pace": pace,
        "estimated_bill": estimated_bill,
        "bill_breakdown": projected_bill_calc,
        "budget": {
            "amount": budget_amount,
            "estimated_bill": estimated_bill,
            "remaining": round(budget_amount - estimated_bill, 2) if budget_amount else None,
            "exceeded_amount": round(max(estimated_bill - budget_amount, 0), 2) if budget_amount else None,
            "progress_percent": round(min(estimated_bill / budget_amount, 1.5) * 100, 1) if budget_amount else None,
        },
        "recommended_daily_limit": daily_limit,
        "bill_shock": shock,
        "health_score": health,
        "top_appliances": top_appliances,
        "standby_units_total": round(standby_units_total, 2),
        "previous_bill_amount": previous_bill_amount,
        "savings_goal_progress_percent": round(savings_progress_ratio * 100, 1),
    }
