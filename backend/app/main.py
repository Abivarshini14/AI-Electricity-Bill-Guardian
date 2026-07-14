import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.database.seed import run_all_seeds

# Import all models so SQLAlchemy metadata is aware of them before create_all
from app.models import models  # noqa: F401

from app.api import (
    auth, profile, properties, meter_readings, appliances, tariffs, bills,
    payments, budgets, notifications, dashboard, ai, appliance_schedules,
    extras, reports, admin, complaints,
)

app = FastAPI(
    title="AI Electricity Bill Guardian API",
    description="Deterministic, admin-configurable electricity usage, billing, and AI-assisted energy management API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_all_seeds(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Electricity Bill Guardian API"}


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(properties.router)
app.include_router(meter_readings.router)
app.include_router(appliances.router)
app.include_router(appliance_schedules.router)
app.include_router(tariffs.router)
app.include_router(bills.router)
app.include_router(payments.router)
app.include_router(budgets.router)
app.include_router(budgets.savings_router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(extras.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(complaints.router)
