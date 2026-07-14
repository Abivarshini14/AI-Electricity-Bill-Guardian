from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.deps import get_current_user, get_owned_property
from app.models.models import AIChatSession, AIChatMessage, AILog, Appliance, Bill, Budget
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.grok_service import ask_grok
from app.services.billing_service import calculate_appliance_consumption

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = None
    if payload.session_id:
        session = db.query(AIChatSession).filter(
            AIChatSession.id == payload.session_id, AIChatSession.user_id == current_user.id
        ).first()
    if not session:
        session = AIChatSession(user_id=current_user.id, property_id=payload.property_id, language=payload.language or "en")
        db.add(session)
        db.commit()
        db.refresh(session)

    context = {"user_name": current_user.name}
    if payload.property_id:
        prop = get_owned_property(payload.property_id, db, current_user)
        appliances = db.query(Appliance).filter(Appliance.property_id == prop.id).all()
        top = None
        if appliances:
            ranked = sorted(appliances, key=lambda a: calculate_appliance_consumption(a)["two_month_units"], reverse=True)
            top = ranked[0].name
        latest_bill = db.query(Bill).filter(Bill.property_id == prop.id).order_by(Bill.created_at.desc()).first()
        budget = db.query(Budget).filter(Budget.property_id == prop.id).order_by(Budget.created_at.desc()).first()
        context.update({
            "property_name": prop.name,
            "property_type": prop.property_type.value,
            "area_category": prop.area_category.value,
            "top_appliance": top,
            "previous_bill_amount": latest_bill.total_amount if latest_bill else None,
            "estimated_bill": latest_bill.total_amount if latest_bill else None,
            "budget": budget.amount if budget else None,
        })

    history = [{"role": m.role, "content": m.content} for m in
               db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()]

    result = await ask_grok(payload.message, context, payload.language or "en", history)

    db.add(AIChatMessage(session_id=session.id, role="user", content=payload.message))
    db.add(AIChatMessage(session_id=session.id, role="assistant", content=result["reply"]))
    db.add(AILog(user_id=current_user.id, endpoint="chat", used_fallback=result["used_fallback"], success=True))
    db.commit()

    return ChatResponse(session_id=session.id, reply=result["reply"], used_fallback=result["used_fallback"])


@router.get("/sessions")
def list_sessions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(AIChatSession).filter(AIChatSession.user_id == current_user.id).order_by(AIChatSession.created_at.desc()).all()
    return [{"id": s.id, "property_id": s.property_id, "created_at": s.created_at} for s in sessions]


@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(AIChatSession).filter(AIChatSession.id == session_id, AIChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(AIChatMessage).filter(AIChatMessage.session_id == session_id).order_by(AIChatMessage.created_at.asc()).all()
    return [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
