# CivicTwin — Production & Vercel Deployment Guide

This guide details how to securely configure environment variables and deploy **CivicTwin** to **Vercel** (Frontend) and your cloud host of choice (Backend).

---

## 1. Environment Variables Overview

CivicTwin separates secrets between the **Next.js Frontend** and the **FastAPI Backend**.

### Frontend Environment Variables (Vercel)
Add these in the **Vercel Dashboard** under **Project Settings &rarr; Environment Variables**:

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key for spatial mapping, cluster pins, and citizen GPS picker | `AIzaSy...` |
| `NEXT_PUBLIC_API_URL` | Yes | Live URL to your deployed FastAPI backend (`/api/v1`) | `https://api.yourdomain.com/api/v1` |

> [!NOTE]
> For local testing, these are stored in `frontend/.env.local`. When deploying to Vercel, enter them in the Vercel Project Environment Variables tab.

---

### Backend Environment Variables (Cloud Server / Container)
Set these on your backend host (Render, Railway, Fly.io, AWS, etc.):

| Variable Name | Required | Description | Default / Example |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for multimodal defect verification (Agent 5) | `AQ...` or your Gemini key |
| `GROQ_API_KEY` | Yes | Groq API key for Whisper voice intake transcription (Agent 1) | `gsk_...` |
| `GOOGLE_MAPS_API_KEY` | Optional | Backend geocoding API key | `AIzaSy...` |
| `SECRET_KEY` | Recommended | Cryptographic key for signing JWT session tokens | `generate-a-random-32-byte-hex-string` |
| `DEMO_MODE` | Optional | Set to `True` for hackathon evaluation mode | `True` |
| `DEMO_DEPT_PASSWORD` | Optional | Default password for departmental officer logins | `CivicAdmin@2026` |
| `OTP_PROVIDER` | Optional | `mock` (instant demo verification) or `twilio_verify` | `mock` |
| `DATABASE_URL` | Optional | Database connection URL | `sqlite:///./civictwin.db` |
| `CORS_ORIGINS` | Optional | Additional allowed CORS origins | `https://your-frontend.vercel.app` |

---

## 2. Deploying the Frontend to Vercel

The repository is pre-configured with `vercel.json` at root and `frontend/vercel.json` for zero-configuration deployment.

### Method A: Connect Git Repository via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [vercel.com/new](https://vercel.com/new) and click **Import** on your `CIVIC_KPR` repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Leave as `./` (or select `frontend/` — both work seamlessly).
   - If using Root (`./`), the root `vercel.json` automatically runs `npm --prefix frontend install` and outputs `frontend/.next`.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = *your Google Maps API key*
   - `NEXT_PUBLIC_API_URL` = *URL of your deployed backend (e.g. `https://civictwin-api.onrender.com/api/v1`)*
5. Click **Deploy**. Vercel will build and assign you a `https://*.vercel.app` domain.

### Method B: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# From the project root
vercel

# For production deployment
vercel --prod
```

---

## 3. Deploying the FastAPI Backend

The backend can be hosted on any platform supporting Python 3.10+ (Render, Railway, Fly.io, DigitalOcean, AWS EC2).

### Option A: Render.com (Web Service)
1. Create a new **Web Service** and connect the repository.
2. Configure settings:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed_db.py`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add your backend environment variables (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc.).
4. Copy the service URL (e.g. `https://civictwin-api.onrender.com`) and set `NEXT_PUBLIC_API_URL=https://civictwin-api.onrender.com/api/v1` in Vercel.

### Option B: Railway.app
1. Create a **New Project &rarr; Deploy from GitHub repo**.
2. Railway will detect Python from `requirements.txt`.
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables.

---

## 4. Security & Best Practices Implemented

- **No Hardcoded Keys**: All API keys and fallback secrets have been completely removed from source code files.
- **`.gitignore` Protection**: Root and frontend `.gitignore` files ensure `.env`, `.env.local`, SQLite databases, and uploaded photos are excluded from Git commits.
- **Dynamic CORS Middleware**: Backend CORS automatically allows all `*.vercel.app` domains using regular expressions (`allow_origin_regex=r"^https:\/\/.*\.vercel\.app$"`).
- **Graceful Client Fallbacks**: The frontend map components handle missing or invalid Google Maps API keys with user-friendly notification badges without crashing the application.
- **Resilient Mock Mode**: Even if external APIs face rate limits or downtime, the frontend gracefully supports demo scenarios with fallback telemetry.
