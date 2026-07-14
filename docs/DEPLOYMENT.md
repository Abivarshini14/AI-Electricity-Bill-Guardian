# Deployment Guide

## Important note on SQLite persistence

SQLite stores data in a single file on disk. On most cloud platforms (including Railway and Render's default free-tier web services), the container filesystem is **ephemeral** — it can be wiped on redeploys, restarts, or scale-to-zero events. SQLite is **not guaranteed to persist permanently** unless you attach a persistent volume/disk.

For real production use, either:
1. Attach a persistent disk/volume and point `DATABASE_URL` at a file inside it, or
2. Migrate to a managed Postgres database (the codebase uses `DATABASE_URL` everywhere, so switching to `postgresql://...` and installing `psycopg2-binary` requires no business-logic changes).

## Railway

### Backend
1. Create a new Railway service from the `backend/` directory.
2. Railway will detect `railway.json` and use Nixpacks to `pip install -r requirements.txt`.
3. Start command (already configured): `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Set environment variables from `.env.example` in the Railway dashboard (never commit real secrets).
5. If you need SQLite to persist across deploys, attach a Railway Volume and set `DATABASE_URL=sqlite:////data/electricity_guardian.db` (mount path `/data`).

### Frontend
1. Create a second Railway service from the `frontend/` directory.
2. Build command: `npm install && npm run build`. Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`.
3. Set `VITE_API_BASE_URL` to your deployed backend's public URL and `VITE_GOOGLE_MAPS_API_KEY` to your Maps key.
4. Set the backend's `FRONTEND_URL` environment variable to this frontend's public URL so CORS allows it.

## Render

### Backend (`backend/render.yaml`)
- Web service, Python environment.
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- A persistent disk is declared in `render.yaml` — adjust `mountPath` and `DATABASE_URL` together if you rely on SQLite persistence.
- Set `GROK_API_KEY`, `FRONTEND_URL`, and SMTP variables in the Render dashboard.

### Frontend (`frontend/render.yaml`)
- Static site. Build: `npm install && npm run build`. Publish directory: `dist`.
- A rewrite rule sends all paths to `index.html` so React Router works on refresh/deep links.
- Set `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY` as environment variables before building (Vite bakes them in at build time).

## General checklist before deploying

- [ ] Set a strong, unique `SECRET_KEY` (never reuse the example value).
- [ ] Set `GROK_API_KEY` if you want live AI responses; the app works without it (deterministic fallback).
- [ ] Set `VITE_GOOGLE_MAPS_API_KEY` with Maps JavaScript API + Places API enabled, and restrict it to your domain(s).
- [ ] Set `FRONTEND_URL` on the backend to match your deployed frontend origin (CORS).
- [ ] Decide on your SQLite persistence strategy or migrate to Postgres.
- [ ] Do not commit `.env` files — only `.env.example` files are tracked.
