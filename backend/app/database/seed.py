from datetime import date

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.models import (
    User, UserProfile, UserRole, TariffSlab, AreaCategory, PropertyType, PeakHourRule, AdminSetting,
)


def seed_demo_admin(db: Session):
    existing = db.query(User).filter(User.email == settings.DEMO_ADMIN_EMAIL.lower()).first()
    if existing:
        return
    admin = User(
        name=settings.DEMO_ADMIN_NAME,
        email=settings.DEMO_ADMIN_EMAIL.lower(),
        password_hash=hash_password(settings.DEMO_ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        profile_completed=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    db.add(UserProfile(user_id=admin.id, city="Chennai", state="Tamil Nadu", country="India",
                        pincode="600001", address="Admin Office, Anna Salai"))
    db.commit()


def seed_demo_tariffs(db: Session):
    if db.query(TariffSlab).first():
        return

    demo_slabs = [
        # City residential (House)
        (AreaCategory.CITY, PropertyType.HOUSE, 0, 100, 3.5, 40, 0, 0, "Demo City House Slab 1"),
        (AreaCategory.CITY, PropertyType.HOUSE, 100, 200, 4.8, 40, 0, 5, "Demo City House Slab 2"),
        (AreaCategory.CITY, PropertyType.HOUSE, 200, 400, 6.5, 40, 20, 8, "Demo City House Slab 3"),
        (AreaCategory.CITY, PropertyType.HOUSE, 400, None, 8.5, 40, 40, 10, "Demo City House Slab 4"),

        # Town residential
        (AreaCategory.TOWN, PropertyType.HOUSE, 0, 100, 3.0, 30, 0, 0, "Demo Town House Slab 1"),
        (AreaCategory.TOWN, PropertyType.HOUSE, 100, 300, 4.2, 30, 0, 5, "Demo Town House Slab 2"),
        (AreaCategory.TOWN, PropertyType.HOUSE, 300, None, 6.0, 30, 20, 8, "Demo Town House Slab 3"),

        # Village residential
        (AreaCategory.VILLAGE, PropertyType.HOUSE, 0, 150, 2.5, 20, 0, 0, "Demo Village House Slab 1"),
        (AreaCategory.VILLAGE, PropertyType.HOUSE, 150, None, 3.8, 20, 0, 5, "Demo Village House Slab 2"),

        # Commercial - Shop
        (AreaCategory.COMMERCIAL, PropertyType.SHOP, 0, 200, 7.0, 100, 30, 12, "Demo Commercial Shop Slab 1"),
        (AreaCategory.COMMERCIAL, PropertyType.SHOP, 200, None, 9.5, 100, 60, 15, "Demo Commercial Shop Slab 2"),

        # Commercial - Office
        (AreaCategory.COMMERCIAL, PropertyType.OFFICE, 0, 300, 7.5, 150, 40, 12, "Demo Commercial Office Slab 1"),
        (AreaCategory.COMMERCIAL, PropertyType.OFFICE, 300, None, 10.0, 150, 80, 15, "Demo Commercial Office Slab 2"),

        # City shop/office fallback
        (AreaCategory.CITY, PropertyType.SHOP, 0, 999999, 8.0, 100, 30, 12, "Demo City Shop Slab"),
        (AreaCategory.CITY, PropertyType.OFFICE, 0, 999999, 8.5, 150, 40, 12, "Demo City Office Slab"),
    ]

    for area, ptype, min_u, max_u, rate, fixed, add, tax, label in demo_slabs:
        db.add(TariffSlab(
            area_category=area, property_type=ptype, min_unit=min_u, max_unit=max_u,
            rate_per_unit=rate, fixed_charge=fixed, additional_charge=add, tax_percent=tax,
            effective_date=date.today(), label=label,
        ))
    db.commit()


def seed_peak_hours(db: Session):
    if db.query(PeakHourRule).first():
        return
    db.add(PeakHourRule(start_time="18:00", end_time="22:00",
                         description="Evening peak demand period - consider shifting flexible appliance usage",
                         tou_rate_multiplier=None))
    db.add(PeakHourRule(start_time="06:00", end_time="09:00",
                         description="Morning peak demand period",
                         tou_rate_multiplier=None))
    db.commit()


def seed_admin_settings(db: Session):
    if db.query(AdminSetting).first():
        return
    db.add(AdminSetting(key="bill_shock_threshold_percent", value="20", description="Percentage increase that triggers a bill shock alert"))
    db.add(AdminSetting(key="high_usage_multiplier", value="2.5", description="Multiplier over recent average usage that triggers a high usage alert"))
    db.commit()


def run_all_seeds(db: Session):
    seed_demo_admin(db)
    seed_demo_tariffs(db)
    seed_peak_hours(db)
    seed_admin_settings(db)
