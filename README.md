# 🛡️ Sovereign OS — Digital Identity Command Center

> **Your Autonomous Digital Bodyguard** · Zero-Knowledge · AES-256 · Multi-Tenant SaaS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stack: FastAPI + Next.js](https://img.shields.io/badge/Stack-FastAPI%20%2B%20Next.js-green)](.)
[![DB: Supabase](https://img.shields.io/badge/DB-Supabase%20%2B%20RLS-orange)](.)
[![Deploy: Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](.)

---

## 🏗️ Architecture Overview

```
sovereign-os/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic settings
│   │   │   ├── auth.py        # JWT + Supabase auth
│   │   │   ├── database.py    # Supabase client
│   │   │   ├── encryption.py  # AES-256-GCM (Zero-Knowledge)
│   │   │   └── logging.py     # Structured logging (privacy-aware)
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py        # Register / Login / Logout
│   │   │   ├── scan.py        # Identity Radar (OSINT)
│   │   │   ├── device.py      # SIM & Session Monitor
│   │   │   ├── privacy.py     # Shadow Cleaner (GDPR)
│   │   │   └── dashboard.py   # Stats & Profile
│   │   ├── services/
│   │   │   ├── osint_engine.py    # Platform scanner + breach checker
│   │   │   ├── device_monitor.py  # HLR lookup + call forwarding
│   │   │   └── shadow_cleaner.py  # GDPR generator + AI summarizer
│   │   └── models/schemas.py  # Pydantic models
│   └── requirements.txt
│
├── frontend/                  # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── login/page.tsx        # Auth
│       │   ├── register/page.tsx     # Auth
│       │   └── dashboard/
│       │       ├── page.tsx          # Main dashboard
│       │       ├── scan/page.tsx     # Identity Radar UI
│       │       ├── device/page.tsx   # Device Monitor UI
│       │       └── privacy/page.tsx  # Shadow Cleaner UI
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── SecurityScoreRing.tsx
│       │   ├── StatCard.tsx
│       │   └── AlertFeed.tsx
│       └── lib/
│           ├── api.ts          # Axios API client
│           ├── store.ts        # Zustand state
│           └── auth-context.tsx
│
├── supabase/migrations/       # SQL schema + RLS policies
├── github-actions/            # Automated OSINT scan scripts
└── .github/workflows/         # CI/CD + scheduled scans
```

---

## 🚀 Zero-Budget Deployment Guide

### Prerequisites
- GitHub account (free)
- Supabase account (free tier)
- Vercel account (free tier)
- Railway account (free tier — for backend)

---

### Step 1: Supabase Setup (Database + Auth)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `sovereign-os`, choose a region close to your users
3. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_initial_schema.sql` → **Run**
4. Go to **Settings → API** → copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
5. Go to **Authentication → Settings** → Enable Email/Password sign-in

---

### Step 2: Backend Deployment (Railway — Free Tier)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select your fork of this repository
3. Set **Root Directory** to `backend`
4. Add environment variables (Settings → Variables):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(64))">
ENCRYPTION_KEY=<generate: python -c "import secrets,base64; print(base64.b64encode(secrets.token_bytes(32)).decode())">
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://your-app.vercel.app"]
```

5. Optional free API keys:
   - `HAVEIBEENPWNED_API_KEY` → [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
   - `ABSTRACT_API_KEY` → [abstractapi.com](https://app.abstractapi.com/) (250 free/month)
   - `OPENROUTER_API_KEY` → [openrouter.ai](https://openrouter.ai/) (free Mistral-7B tier)

6. Railway will give you a URL like `https://sovereign-os-api.up.railway.app`

---

### Step 3: Frontend Deployment (Vercel — Free Tier)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import from GitHub**
2. Select your repository, set **Root Directory** to `frontend`
3. Add environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://sovereign-os-api.up.railway.app
```

4. Click **Deploy** — Vercel handles everything automatically
5. Your app is live at `https://your-app.vercel.app`

---

### Step 4: GitHub Actions (Automated Scans)

1. In your GitHub repo → **Settings → Secrets → Actions**
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `HAVEIBEENPWNED_API_KEY`

3. The workflow at `.github/workflows/osint_scan.yml` runs daily at 6 AM UTC automatically.

---

## 🔐 Security Architecture

### Zero-Knowledge Design
- User data is encrypted with **AES-256-GCM** before storage
- Encryption keys are derived from user passwords using **PBKDF2-SHA256** (310,000 iterations)
- The server **never sees plaintext** sensitive data
- Authentication tag prevents tampering (GCM mode)

### Multi-Tenant Isolation
- Every database table has **Row-Level Security (RLS)** enabled
- Users can **only access their own data** — enforced at the database level
- Even if the API were compromised, cross-tenant data leakage is impossible

### API Security
- **Rate limiting** on all endpoints (slowapi)
- **JWT authentication** with 7-day expiry
- **Security headers** on all responses (HSTS, CSP, X-Frame-Options)
- **Input validation** via Pydantic with strict type checking
- **Structured logging** with automatic PII redaction

### Privacy in OSINT
- **k-Anonymity** for HIBP password checks (SHA-1 prefix only sent)
- Email targets stored as **SHA-256 hashes only** in scan history
- Username targets stored as **integer hashes** — never plaintext

---

## 📡 API Reference

### Authentication
```
POST /api/v1/auth/register   — Create account
POST /api/v1/auth/login      — Get JWT token
POST /api/v1/auth/logout     — Invalidate session
```

### Identity Radar
```
POST /api/v1/scan/username   — Scan username across 10+ platforms
POST /api/v1/scan/email      — Check email in breach databases
POST /api/v1/scan/full       — Full scan: platforms + breaches + score
```

### Device Monitor
```
POST /api/v1/device/sim-check             — HLR SIM integrity check
GET  /api/v1/device/call-forwarding-guide — USSD codes by carrier
GET  /api/v1/device/session-guide         — Active session audit links
```

### Shadow Cleaner
```
POST /api/v1/privacy/gdpr-requests  — Generate deletion request emails
GET  /api/v1/privacy/brokers        — List all data brokers
POST /api/v1/privacy/summarize-alerts — AI alert summary
```

### Dashboard
```
GET /api/v1/dashboard/stats    — Security metrics
GET /api/v1/dashboard/profile  — User profile
```

---

## 💼 Subscription Tiers

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Platform scans/hour | 10 | 100 |
| Full identity scans/hour | 3 | 30 |
| Breach checker | ✓ | ✓ |
| GDPR request generator | ✓ (9 brokers) | ✓ (all brokers) |
| SIM integrity check | ✓ | ✓ |
| AI security summaries | — | ✓ |
| Automated email sending | — | ✓ |
| Scan history & reports | — | ✓ |

---

## 🛠️ Local Development

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your Supabase keys
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Fill in .env.local
npm run dev
```

Visit `http://localhost:3000` for the app, `http://localhost:8000/api/docs` for API docs.

---

## 📄 License

MIT License — Free to use, modify, and deploy. Attribution appreciated.

---

*Built with ❤️ for digital sovereignty. Your data is yours.*
