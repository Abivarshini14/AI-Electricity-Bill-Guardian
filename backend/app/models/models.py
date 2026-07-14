import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, Date
)
from sqlalchemy.orm import relationship

from app.database.session import Base


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class PropertyType(str, enum.Enum):
    HOUSE = "House"
    SHOP = "Shop"
    OFFICE = "Office"


class PropertyCategory(str, enum.Enum):
    OWN = "Own"
    RENTAL = "Rental"
    APARTMENT = "Apartment"
    OTHER = "Other"


class AreaCategory(str, enum.Enum):
    CITY = "City"
    TOWN = "Town"
    VILLAGE = "Village"
    COMMERCIAL = "Commercial Area"
    OTHER = "Other"


class BillStatus(str, enum.Enum):
    PENDING = "Pending"
    GENERATED = "Generated"
    PAID = "Paid"
    OVERDUE = "Overdue"


class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    FAILED = "Failed"


class ComplaintCategory(str, enum.Enum):
    HIGH_BILL = "High Electricity Bill"
    METER_ISSUE = "Meter Issue"
    INCORRECT_READING = "Incorrect Meter Reading"
    PAYMENT_ISSUE = "Payment Issue"
    BILL_GENERATION_ISSUE = "Bill Generation Issue"
    POWER_SUPPLY_ISSUE = "Power Supply Issue"
    VOLTAGE_ISSUE = "Voltage Issue"
    CONNECTION_ISSUE = "Electricity Connection Issue"
    OTHER = "Other"


class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("AIChatSession", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    photo_url = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    language = Column(String(10), default="en")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    property_type = Column(Enum(PropertyType), nullable=False)
    property_category = Column(Enum(PropertyCategory), nullable=False)
    area_category = Column(Enum(AreaCategory), nullable=False)
    formatted_address = Column(String(400), nullable=False)
    consumer_number = Column(String(60), nullable=True)
    meter_number = Column(String(60), nullable=True)
    electricity_board = Column(String(120), nullable=True)
    occupancy_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="properties")
    billing_cycle = relationship("BillingCycle", back_populates="property", uselist=False, cascade="all, delete-orphan")
    meter_readings = relationship("MeterReading", back_populates="property", cascade="all, delete-orphan")
    appliances = relationship("Appliance", back_populates="property", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="property", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="property", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="property", cascade="all, delete-orphan")
    challenges = relationship("EnergyChallenge", back_populates="property", cascade="all, delete-orphan")
    outages = relationship("OutageLog", back_populates="property", cascade="all, delete-orphan")
    away_periods = relationship("AwayMode", back_populates="property", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="property", cascade="all, delete-orphan")


class BillingCycle(Base):
    __tablename__ = "billing_cycles"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), unique=True, nullable=False)
    cycle_length_days = Column(Integer, default=60)
    cycle_start = Column(Date, nullable=False)
    cycle_end = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="billing_cycle")


class MeterReading(Base):
    __tablename__ = "meter_readings"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    previous_reading = Column(Float, nullable=False)
    current_reading = Column(Float, nullable=False)
    units_consumed = Column(Float, nullable=False)
    reading_date = Column(Date, nullable=False)
    meter_image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="meter_readings")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    quantity = Column(Integer, default=1)
    wattage = Column(Float, nullable=False)
    daily_usage_hours = Column(Float, default=0)
    standby_wattage = Column(Float, default=0)
    standby_hours = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="appliances")
    schedules = relationship("ApplianceSchedule", back_populates="appliance", cascade="all, delete-orphan")


class ApplianceSchedule(Base):
    __tablename__ = "appliance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliances.id"), nullable=False, index=True)
    start_time = Column(String(5), nullable=False)  # HH:MM
    end_time = Column(String(5), nullable=False)
    days_of_week = Column(String(60), nullable=False)  # comma separated Mon,Tue...
    expected_daily_units = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    appliance = relationship("Appliance", back_populates="schedules")


class TariffSlab(Base):
    __tablename__ = "tariff_slabs"

    id = Column(Integer, primary_key=True, index=True)
    area_category = Column(Enum(AreaCategory), nullable=False)
    property_type = Column(Enum(PropertyType), nullable=False)
    min_unit = Column(Float, nullable=False)
    max_unit = Column(Float, nullable=True)  # null = no upper bound
    rate_per_unit = Column(Float, nullable=False)
    fixed_charge = Column(Float, default=0)
    additional_charge = Column(Float, default=0)
    tax_percent = Column(Float, default=0)
    effective_date = Column(Date, default=datetime.utcnow().date)
    is_active = Column(Boolean, default=True)
    label = Column(String(120), default="Demo Tariff")


class PeakHourRule(Base):
    __tablename__ = "peak_hour_rules"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    description = Column(String(255), nullable=True)
    tou_rate_multiplier = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    cycle_start = Column(Date, nullable=False)
    cycle_end = Column(Date, nullable=False)
    units_consumed = Column(Float, nullable=False)
    energy_charge = Column(Float, nullable=False)
    fixed_charge = Column(Float, nullable=False)
    additional_charge = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(BillStatus), default=BillStatus.GENERATED)
    is_estimated = Column(Boolean, default=True)
    pdf_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="bills")
    payment = relationship("Payment", back_populates="bill", uselist=False, cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String(30), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    reference_id = Column(String(60), nullable=True)
    receipt_pdf_path = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bill = relationship("Bill", back_populates="payment")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    cycle_start = Column(Date, nullable=False)
    cycle_end = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    target_amount = Column(Float, nullable=False)
    cycle_start = Column(Date, nullable=False)
    cycle_end = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="savings_goals")


class EnergyChallenge(Base):
    __tablename__ = "energy_challenges"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    target_type = Column(String(30), nullable=False)  # units | amount | appliance
    target_value = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    badge_awarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="challenges")


class EnergyStreak(Base):
    __tablename__ = "energy_streaks"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    current_streak_weeks = Column(Integer, default=0)
    best_streak_weeks = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)


class AwayMode(Base):
    __tablename__ = "away_modes"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    checklist_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="away_periods")


class OutageLog(Base):
    __tablename__ = "outage_logs"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_hours = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="outages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    type = Column(String(40), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("AIChatMessage", back_populates="session", cascade="all, delete-orphan")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_chat_sessions.id"), nullable=False, index=True)
    role = Column(String(10), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AIChatSession", back_populates="messages")


class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String(60), nullable=False)
    used_fallback = Column(Boolean, default=False)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    category = Column(Enum(ComplaintCategory), nullable=False)
    subject = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False)
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    property = relationship("Property", back_populates="complaints")


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
