# Application Workflow

## New user journey

```
Open App → Register (name, email, phone, password) → Account created, JWT issued
  → Login → JWT validated
    → Profile incomplete? → Setup Profile (photo, address, city, state, country, pincode)
        → Saved to SQLite → Dashboard
    → Profile already complete? → Dashboard directly
```

Once `profile_completed` is `true`, the user is never redirected back to the setup screen. They can still edit any field later from **Profile**.

## Property & billing loop

```
Add Property (name, type, category, area category, Google-Maps-confirmed address,
              consumer/meter number, board, occupancy)
  → Billing cycle auto-created (default 60 days)
  → Add Meter Readings periodically
  → Add Appliances (auto-calculated daily/monthly/two-month units and cost)
  → Dashboard aggregates: usage pace, projected bill, budget status, bill-shock check,
    usage health score, top appliances
  → Generate Bill (uses actual recorded readings for the cycle, produces PDF,
    rolls the billing cycle forward)
  → Pay Bill (simulated) → Receipt PDF + notification (+ email if SMTP configured)
```

## Complaint workflow

```
User raises complaint (category, subject, description, optional attachment)
  → Status: Submitted → in-app notification to user
Admin reviews (Admin Complaint Management)
  → Updates status along Submitted → Under Review → In Progress → Resolved → Closed
  → Adds admin response
  → User receives in-app notification (+ email if SMTP configured) on every status change
```

Status transitions are validated server-side; only the next logical stage (or a jump to Closed) is accepted.

## AI assistant workflow

```
User selects a property and asks a question (typed or via voice input)
  → Backend gathers only that user's authorized context for that property
    (appliances, latest bill, budget, health score)
  → Grok API is called with that context
  → If GROK_API_KEY is missing or the call fails, a deterministic rule-based
    response is returned instead — the app never crashes or blocks the user
  → Conversation history stored per session; AI usage logged (without storing
    any API keys) for admin visibility
```

## Alerting rules (all deterministic, no ML)

- **High Usage Alert**: new meter reading > 2.5x the average of the last 3 readings.
- **Budget Alert**: projected bill for the cycle exceeds the configured budget.
- **Bill Shock Alert**: projected bill is >= 20% higher than the previous generated bill.
- **Usage Health Score**: weighted rule-based score (0-100) combining budget status, daily-limit adherence, consumption trend, standby wastage, and savings-goal progress.
