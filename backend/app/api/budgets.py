from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import Budget, SavingsGoal
from app.schemas.schemas import BudgetCreateRequest, SavingsGoalCreateRequest

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.post("")
def create_budget(payload: BudgetCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be greater than 0")
    budget = Budget(property_id=prop.id, cycle_start=payload.cycle_start, cycle_end=payload.cycle_end, amount=payload.amount)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return {"id": budget.id, "property_id": budget.property_id, "amount": budget.amount,
            "cycle_start": budget.cycle_start, "cycle_end": budget.cycle_end}


@router.get("")
def get_latest_budget(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    budget = db.query(Budget).filter(Budget.property_id == property_id).order_by(Budget.created_at.desc()).first()
    if not budget:
        return None
    return {"id": budget.id, "property_id": budget.property_id, "amount": budget.amount,
            "cycle_start": budget.cycle_start, "cycle_end": budget.cycle_end}


savings_router = APIRouter(prefix="/api/savings-goals", tags=["Savings Goals"])


@savings_router.post("")
def create_goal(payload: SavingsGoalCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = get_owned_property(payload.property_id, db, current_user)
    goal = SavingsGoal(
        property_id=prop.id, title=payload.title, target_amount=payload.target_amount,
        cycle_start=payload.cycle_start, cycle_end=payload.cycle_end,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, "title": goal.title, "target_amount": goal.target_amount}


@savings_router.get("")
def list_goals(property_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    get_owned_property(property_id, db, current_user)
    goals = db.query(SavingsGoal).filter(SavingsGoal.property_id == property_id).order_by(SavingsGoal.created_at.desc()).all()
    return [{"id": g.id, "title": g.title, "target_amount": g.target_amount,
             "cycle_start": g.cycle_start, "cycle_end": g.cycle_end} for g in goals]
