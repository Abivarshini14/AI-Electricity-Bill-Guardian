from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    profile_completed: bool
    name: str
    user_id: int


# ---------- Profile ----------
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    language: Optional[str] = "en"


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    email: str
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    language: Optional[str] = "en"
    profile_completed: bool


# ---------- Property ----------
class PropertyCreateRequest(BaseModel):
    name: str
    property_type: str
    property_category: str
    area_category: str
    formatted_address: str
    consumer_number: Optional[str] = None
    meter_number: Optional[str] = None
    electricity_board: Optional[str] = None
    occupancy_count: Optional[int] = 1
    cycle_length_days: Optional[int] = 60


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    property_type: str
    property_category: str
    area_category: str
    formatted_address: str
    consumer_number: Optional[str]
    meter_number: Optional[str]
    electricity_board: Optional[str]
    occupancy_count: int


# ---------- Meter Reading ----------
class MeterReadingCreateRequest(BaseModel):
    property_id: int
    previous_reading: float
    current_reading: float
    reading_date: date


class MeterReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    previous_reading: float
    current_reading: float
    units_consumed: float
    reading_date: date
    meter_image_url: Optional[str] = None


# ---------- Appliance ----------
class ApplianceCreateRequest(BaseModel):
    property_id: int
    name: str
    quantity: int = 1
    wattage: float
    daily_usage_hours: float = 0
    standby_wattage: float = 0
    standby_hours: float = 0


class ApplianceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    name: str
    quantity: int
    wattage: float
    daily_usage_hours: float
    standby_wattage: float
    standby_hours: float
    daily_units: float = 0
    monthly_units: float = 0
    two_month_units: float = 0
    estimated_cost: float = 0
    standby_units: float = 0


# ---------- Tariff ----------
class TariffSlabCreateRequest(BaseModel):
    area_category: str
    property_type: str
    min_unit: float
    max_unit: Optional[float] = None
    rate_per_unit: float
    fixed_charge: float = 0
    additional_charge: float = 0
    tax_percent: float = 0
    label: Optional[str] = "Demo Tariff"


class TariffSlabResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    area_category: str
    property_type: str
    min_unit: float
    max_unit: Optional[float]
    rate_per_unit: float
    fixed_charge: float
    additional_charge: float
    tax_percent: float
    label: str
    is_active: bool


# ---------- Budget / Savings ----------
class BudgetCreateRequest(BaseModel):
    property_id: int
    cycle_start: date
    cycle_end: date
    amount: float


class SavingsGoalCreateRequest(BaseModel):
    property_id: int
    title: str
    target_amount: float
    cycle_start: date
    cycle_end: date


# ---------- Bill ----------
class BillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    cycle_start: date
    cycle_end: date
    units_consumed: float
    energy_charge: float
    fixed_charge: float
    additional_charge: float
    tax_amount: float
    total_amount: float
    due_date: date
    status: str
    is_estimated: bool


# ---------- Payment ----------
class PaymentCreateRequest(BaseModel):
    bill_id: int
    method: str
    mock_reference: Optional[str] = None


# ---------- Notification ----------
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


# ---------- AI ----------
class ChatRequest(BaseModel):
    property_id: Optional[int] = None
    message: str
    language: Optional[str] = "en"
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    session_id: int
    reply: str
    used_fallback: bool


# ---------- Outage ----------
class OutageCreateRequest(BaseModel):
    property_id: int
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


# ---------- Away Mode ----------
class AwayModeCreateRequest(BaseModel):
    property_id: int
    start_date: date
    end_date: date


# ---------- Complaints ----------
class ComplaintCreateRequest(BaseModel):
    property_id: int
    category: str
    subject: str
    description: str


class ComplaintStatusUpdateRequest(BaseModel):
    status: str
    admin_response: Optional[str] = None


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    property_id: int
    category: str
    subject: str
    description: str
    attachment_url: Optional[str] = None
    status: str
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------- Challenge ----------
class ChallengeCreateRequest(BaseModel):
    property_id: int
    name: str
    target_type: str
    target_value: float
    start_date: date
    end_date: date
