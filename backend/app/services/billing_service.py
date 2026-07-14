"""
Deterministic electricity calculation engine.
No machine learning is used anywhere in this module - all logic is rule-based
arithmetic driven by admin-configurable tariff slabs.
"""
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import TariffSlab, Appliance, Bill, Property


def calculate_appliance_consumption(appliance: Appliance) -> dict:
    """Returns daily/monthly/two-month units, cost placeholder, and standby waste."""
    daily_wh = appliance.quantity * appliance.wattage * appliance.daily_usage_hours
    daily_units = daily_wh / 1000.0

    standby_wh = appliance.quantity * appliance.standby_wattage * appliance.standby_hours
    standby_daily_units = standby_wh / 1000.0

    monthly_units = daily_units * 30
    two_month_units = daily_units * 60
    standby_two_month_units = standby_daily_units * 60

    return {
        "daily_units": round(daily_units, 3),
        "monthly_units": round(monthly_units, 2),
        "two_month_units": round(two_month_units, 2),
        "standby_units": round(standby_two_month_units, 2),
    }


def get_applicable_tariff_slabs(db: Session, area_category: str, property_type: str) -> List[TariffSlab]:
    slabs = (
        db.query(TariffSlab)
        .filter(
            TariffSlab.area_category == area_category,
            TariffSlab.property_type == property_type,
            TariffSlab.is_active == True,  # noqa: E712
        )
        .order_by(TariffSlab.min_unit.asc())
        .all()
    )
    return slabs


def calculate_slab_wise_bill(units: float, slabs: List[TariffSlab]) -> dict:
    """Slab-wise (progressive) tariff calculation."""
    if not slabs:
        # Safe deterministic fallback default tariff so the app never crashes
        return {
            "energy_charge": round(units * 6.0, 2),
            "fixed_charge": 50.0,
            "additional_charge": 0.0,
            "tax_amount": round(units * 6.0 * 0.05, 2),
            "total_amount": round(units * 6.0 * 1.05 + 50.0, 2),
            "used_fallback_tariff": True,
        }

    remaining_units = units
    energy_charge = 0.0
    fixed_charge = 0.0
    additional_charge = 0.0
    tax_percent = 0.0

    for slab in slabs:
        slab_max = slab.max_unit if slab.max_unit is not None else float("inf")
        slab_capacity = max(0.0, slab_max - slab.min_unit)
        units_in_slab = min(remaining_units, slab_capacity) if remaining_units > 0 else 0

        if units_in_slab > 0:
            energy_charge += units_in_slab * slab.rate_per_unit
            fixed_charge = max(fixed_charge, slab.fixed_charge)
            additional_charge = max(additional_charge, slab.additional_charge)
            tax_percent = slab.tax_percent
            remaining_units -= units_in_slab

        if remaining_units <= 0:
            break

    tax_amount = (energy_charge + fixed_charge + additional_charge) * (tax_percent / 100.0)
    total_amount = energy_charge + fixed_charge + additional_charge + tax_amount

    return {
        "energy_charge": round(energy_charge, 2),
        "fixed_charge": round(fixed_charge, 2),
        "additional_charge": round(additional_charge, 2),
        "tax_amount": round(tax_amount, 2),
        "total_amount": round(total_amount, 2),
        "used_fallback_tariff": False,
    }


def calculate_usage_pace(cycle_start: date, cycle_end: date, units_so_far: float, today: Optional[date] = None):
    today = today or date.today()
    total_days = max((cycle_end - cycle_start).days, 1)
    days_completed = max(min((today - cycle_start).days, total_days), 0)
    days_completed = days_completed if days_completed > 0 else 1
    avg_daily = units_so_far / days_completed if days_completed else 0
    projected_units = avg_daily * total_days
    return {
        "total_days": total_days,
        "days_completed": days_completed,
        "days_remaining": max(total_days - days_completed, 0),
        "avg_daily_usage": round(avg_daily, 2),
        "projected_cycle_usage": round(projected_units, 2),
    }


def calculate_recommended_daily_limit(budget_amount: float, slabs: List[TariffSlab], cycle_days: int = 60) -> float:
    if not slabs:
        avg_rate = 6.0
    else:
        avg_rate = sum(s.rate_per_unit for s in slabs) / len(slabs)
    if avg_rate <= 0:
        avg_rate = 6.0
    fixed_charge_est = slabs[0].fixed_charge if slabs else 50.0
    usable_budget = max(budget_amount - fixed_charge_est, 0)
    total_units_budget = usable_budget / avg_rate
    return round(total_units_budget / cycle_days, 2)


def calculate_health_score(
    budget_status_ratio: float,
    daily_limit_ratio: float,
    consumption_increase_percent: float,
    standby_waste_ratio: float,
    savings_progress_ratio: float,
) -> dict:
    """
    Rule-based (NOT machine learning) 0-100 score.
    Each factor is weighted and penalizes/rewards deterministically.
    """
    score = 100.0

    # Budget status: ratio of estimated bill / budget. >1 is bad.
    if budget_status_ratio > 1:
        score -= min((budget_status_ratio - 1) * 100, 30)

    # Daily usage vs recommended limit
    if daily_limit_ratio > 1:
        score -= min((daily_limit_ratio - 1) * 80, 25)

    # Consumption increase vs previous cycle
    if consumption_increase_percent > 0:
        score -= min(consumption_increase_percent * 0.5, 20)
    else:
        score += min(abs(consumption_increase_percent) * 0.1, 5)

    # Standby wastage
    score -= min(standby_waste_ratio * 40, 15)

    # Savings goal progress rewards
    score += min(savings_progress_ratio * 10, 10)

    score = max(0, min(100, round(score)))

    if score >= 85:
        category = "Excellent"
    elif score >= 70:
        category = "Good"
    elif score >= 50:
        category = "Moderate"
    else:
        category = "High Usage"

    return {"score": score, "category": category}


def calculate_bill_shock(current_projected: float, previous_bill: float, threshold_percent: float = 20.0) -> dict:
    if previous_bill <= 0:
        return {"percent_change": 0.0, "is_shock": False}
    percent_change = ((current_projected - previous_bill) / previous_bill) * 100
    return {
        "percent_change": round(percent_change, 2),
        "is_shock": percent_change >= threshold_percent,
    }


def default_billing_cycle(start: Optional[date] = None, length_days: int = 60):
    start = start or date.today()
    end = start + timedelta(days=length_days)
    due = end + timedelta(days=15)
    return start, end, due
