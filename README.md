<<<<<<< HEAD
# AI Electricity Bill Guardian

A full-stack electricity usage, billing estimation, and AI-assisted energy management app for households, shops, and offices — with multi-property support, admin-configurable tariffs, an electricity complaint system, and a Grok-powered assistant with a deterministic fallback.

> **Important:** This is an independent demo/academic project. Bills are estimated using admin-configurable demo tariffs and are **not** official electricity board documents. Payments are **simulated** — no real card, UPI, or banking credentials are ever collected or stored. No machine learning is used anywhere: every calculation (tariffs, health score, alerts, bill shock) is deterministic, transparent, rule-based arithmetic.

## Project Overview

Users register, complete their profile, and add one or more properties (house, shop, office) with a Google-Maps-confirmed address. For each property they log meter readings and appliances, set a budget and savings goals, generate a two-month estimated bill (PDF), pay it (simulated), track complaints, and chat with an AI assistant about their usage. Admins configure tariffs, peak-hour rules, and manage users, bills, payments, alerts, and complaints from a separate dashboard.

## Features

- JWT authentication with USER/ADMIN roles and per-resource ownership checks
- Multi-property management with Google-Maps-based address confirmation
- Meter reading history with automatic high-usage detection
- Appliance tracking (daily/monthly/two-month units, standby wastage) + on-time planner + what-if simulator
- Admin-configurable, slab-wise deterministic tariff engine
- Two-month billing cycle tracker, budget guardian, usage health score, bill-shock alerts
- Savings goals, energy challenges, energy streaks, away mode, outage log, solar calculator
- Grok (xAI) AI assistant with English/Tamil support, voice input, and a rule-based fallback when the API key is missing or the call fails
- Electricity complaint system: raise, track, filter, attach proof; admin review with status workflow and automatic notifications
- PDF bill generation, PDF payment receipts, PDF two-month AI energy reports (ReportLab)
- Simulated payments (UPI / cards / net banking / QR) — no sensitive payment data stored
- Email (SMTP, optional) + in-app notifications
- Admin dashboard: users, properties, bills, payments, alerts, tariffs, complaints, analytics
- Railway + Render deployment configs for both backend and frontend

## Technology Stack

**Frontend:** React 18, Vite, JavaScript (no TypeScript), React Router DOM, Axios, Recharts, Google Maps JavaScript API, plain CSS.

**Backend:** Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic, SQLite, JWT (python-jose), Passlib (bcrypt), Uvicorn, python-multipart, HTTPX, ReportLab, smtplib.

**AI:** Grok API (xAI) via a dedicated service layer with a deterministic rule-based fallback.

## Project Architecture

React SPA (Vite dev server / static build) talks to a FastAPI backend over REST + JWT. The backend owns a single SQLite database (auto-created on startup, auto-seeded with demo tariffs/admin), issues PDFs to disk, and optionally calls the Grok API and an SMTP server — both are fully optional and the app degrades gracefully without them.

## Folder Structure

```
AI-Electricity-Bill-Guardian/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (one file per resource)
│   │   ├── core/           # config, security, auth dependencies
│   │   ├── database/       # SQLAlchemy session + seed script
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # billing engine, Grok service, PDF, email, notifications
│   │   ├── uploads/        # runtime file storage (photos, bills, receipts, complaints)
│   │   └── main.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── railway.json
│   ├── render.yaml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Sidebar, Topbar, MapAddressSelector, shared UI
│   │   ├── context/        # Auth, Property, Toast providers
│   │   ├── pages/          # one file per route (~35 pages)
│   │   ├── services/       # Axios client + grouped endpoint functions
│   │   ├── styles/         # global.css design system
│   │   └── utils/          # i18n (EN/TA)
│   ├── package.json
│   ├── vite.config.js
│   ├── railway.json
│   ├── render.yaml
│   └── .env.example
├── docs/
├── .gitignore
├── README.md
└── LICENSE
```

## Local Setup

### Prerequisites
- Python 3.11
- Node.js 18+ and npm

### Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

```bash
pip install -r requirements.txt
cp .env.example .env   # edit values as needed (Windows: copy .env.example .env)
uvicorn app.main:app --reload
```

The backend starts on `http://localhost:8000`, auto-creates `electricity_guardian.db`, and seeds demo tariffs, peak-hour rules, admin settings, and a demo admin account (see below). Interactive API docs: `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL and VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `SECRET_KEY` | JWT signing secret — set a long random value |
| `JWT_ALGORITHM` | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime |
| `DATABASE_URL` | SQLite by default; swap for Postgres later without code changes |
| `GROK_API_KEY` / `GROK_API_URL` / `GROK_MODEL` | xAI Grok credentials (optional — app falls back gracefully) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM_EMAIL` | Optional email notifications |
| `FRONTEND_URL` | Used for CORS |
| `ENVIRONMENT` | `development` / `production` |
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` / `DEMO_ADMIN_NAME` | Seeded demo admin (development only) |

### Frontend (`frontend/.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Enables the address search/map/confirm flow; without it, the property form falls back to a plain text address field |

## Grok API Setup

1. Create an API key in the xAI Console.
2. Set `GROK_API_KEY` (and optionally `GROK_API_URL`, `GROK_MODEL`) in `backend/.env`.
3. If the key is missing or a call fails for any reason, the AI Assistant and AI Energy Report automatically use deterministic, rule-based guidance instead — the app never crashes or blocks on this dependency.

## Google Maps API Setup

1. In Google Cloud Console, enable **Maps JavaScript API** and **Places API**.
2. Create an API key, restrict it to your domain(s) for production.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.
4. Only the confirmed formatted address is stored — latitude/longitude are used internally for map placement only and are never shown in the UI or sent to the backend.

## SMTP Setup (optional)

Set the `SMTP_*` variables in `backend/.env` to enable bill/payment/complaint emails. If left blank, the app silently skips email and still creates in-app notifications — nothing breaks.

## SQLite Information

SQLite is used for simplicity and zero external dependencies locally. See `docs/DEPLOYMENT.md` for important notes on filesystem persistence when deploying to Railway/Render, and how to migrate to Postgres later via `DATABASE_URL`.

## Demo Admin Setup

On first backend startup, a demo admin is auto-seeded from your `.env` values:

- Email: `DEMO_ADMIN_EMAIL` (default `admin@guardianapp.com`)
- Password: `DEMO_ADMIN_PASSWORD` (default `Admin@12345`)

**Change these before any real deployment.** This is a development convenience only.

## Railway Deployment

See `docs/DEPLOYMENT.md` for full steps. Summary: deploy `backend/` and `frontend/` as two separate Railway services using the included `railway.json` files; set environment variables in the dashboard; point the frontend's `VITE_API_BASE_URL` at the backend's public URL.

## Render Deployment

See `docs/DEPLOYMENT.md`. Summary: `backend/render.yaml` defines a Python web service (with an optional persistent disk); `frontend/render.yaml` defines a static site with SPA rewrite rules.

## Troubleshooting

- **`/health` returns nothing / connection refused** — the backend isn't running; check `uvicorn` logs.
- **401 on every request** — token expired or missing; log in again.
- **403 "You do not own this property"** — you're using a property ID that belongs to another user; select a property you own.
- **AI Assistant always shows fallback text** — `GROK_API_KEY` is unset or the xAI API call failed; this is expected graceful-degradation behavior, not a bug.
- **Google Map doesn't load** — `VITE_GOOGLE_MAPS_API_KEY` is missing/invalid; the property form automatically falls back to a manual address text field.
- **CORS errors in the browser console** — make sure the backend's `FRONTEND_URL` matches the origin your frontend is actually served from.

## API Documentation

- Live interactive docs: `http://localhost:8000/docs` (Swagger UI) or `/redoc`
- Written overview: `docs/API_DOCUMENTATION.md`
- Database schema: `docs/DATABASE_SCHEMA.md`
- End-to-end workflow: `docs/WORKFLOW.md`
- Deployment details: `docs/DEPLOYMENT.md`
=======
# AI-Electricity-Bill-Guardian
>>>>>>> 24dc172676fc70d235b832f1a57ef02489b914da
