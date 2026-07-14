# Database Schema

Engine: **SQLite** (file: `electricity_guardian.db`), accessed through **SQLAlchemy ORM**.
`DATABASE_URL` is configurable so the same models can later target PostgreSQL without code changes.

Tables are created automatically on backend startup via `Base.metadata.create_all()`. See `backend/app/models/models.py` for the full source of truth.

## Core tables

| Table | Purpose |
|---|---|
| `users` | Login credentials, role (USER/ADMIN), profile-completion flag |
| `user_profiles` | Photo, address, city/state/country/pincode, language preference |
| `properties` | Multi-property records owned by a user (House/Shop/Office) |
| `billing_cycles` | One active two-month cycle per property (start, end, due date) |
| `meter_readings` | Previous/current reading, computed units consumed |
| `appliances` | Wattage, usage hours, standby wattage/hours per property |
| `appliance_schedules` | Planned on/off times and days for an appliance |
| `tariff_slabs` | Admin-configurable slab-wise tariff rules (area x property type x unit range) |
| `peak_hour_rules` | Admin-configurable peak-hour windows |
| `bills` | Generated two-month bills with full charge breakdown |
| `payments` | Simulated payment records linked 1:1 to a bill |
| `budgets` | Per-cycle budget amount per property |
| `savings_goals` | Target savings amount per cycle |
| `energy_challenges` | User-defined usage/amount reduction challenges |
| `energy_streaks` | Consecutive weeks within target, per property |
| `away_modes` | Vacation date ranges + checklist |
| `outage_logs` | Manually logged power-cut start/end/duration |
| `notifications` | In-app notification feed per user |
| `ai_chat_sessions` / `ai_chat_messages` | Grok assistant conversation history |
| `ai_logs` | Whether each AI call used the live API or the deterministic fallback |
| `complaints` | Complaint records (category, subject, description, attachment, status, admin response) |
| `admin_settings` | Key/value store for tunables like alert thresholds |

## Key relationships

- `User 1-1 UserProfile`
- `User 1-N Property` (a user can own multiple properties)
- `Property 1-1 BillingCycle`
- `Property 1-N MeterReading, Appliance, Bill, Budget, SavingsGoal, EnergyChallenge, OutageLog, AwayMode, Complaint`
- `Appliance 1-N ApplianceSchedule`
- `Bill 1-1 Payment`
- `User 1-N Complaint`, `Property 1-N Complaint`

All child tables use cascade-delete semantics at the ORM level (`cascade="all, delete-orphan"`), so deleting a property cleans up its dependent records.

## Enums (stored as strings)

- `UserRole`: USER, ADMIN
- `PropertyType`: House, Shop, Office
- `PropertyCategory`: Own, Rental, Apartment, Other
- `AreaCategory`: City, Town, Village, Commercial Area, Other
- `BillStatus`: Pending, Generated, Paid, Overdue
- `PaymentStatus`: Pending, Paid, Failed
- `ComplaintCategory`: High Electricity Bill, Meter Issue, Incorrect Meter Reading, Payment Issue, Bill Generation Issue, Power Supply Issue, Voltage Issue, Electricity Connection Issue, Other
- `ComplaintStatus`: Submitted, Under Review, In Progress, Resolved, Closed
