# CivicTwin — Complete Project Folder Structure & Architecture Map

This document outlines the complete directory layout, file organization, and architectural roles of all components in the **CivicTwin** repository.

---

## 🌳 High-Level Tree View

```text
CIVIC_KPR/
├── .env                              # Local backend environment variables (git-ignored)
├── .env.example                      # Backend environment variable template & documentation
├── .gitignore                        # Git ignore rules for root, secrets, build artifacts
├── DEPLOYMENT.md                     # Comprehensive Vercel & Cloud deployment guide
├── HOW_IT_WORKS.md                   # System workflow & agent pipeline documentation
├── PROJECT_PROGRESS_AND_ARCHITECTURE.md # Deep dive into technical architecture & roadmap
├── PROJECT_STRUCTURE.md              # Complete folder structure reference (this file)
├── README.md                         # Project overview, quickstart & credentials
├── generate_assets.py                # Asset generator for demo before/after defect images
├── package.json                      # Root orchestration package (delegates to frontend)
├── package-lock.json                 # Root npm lockfile
├── requirements.txt                  # Python backend dependencies (FastAPI, SQLAlchemy, etc.)
├── seed_db.py                        # Automated database seeder with realistic civic data
├── start_civictwin.bat               # 1-Click Windows startup orchestration script
├── start_civictwin.sh                # 1-Click Linux / macOS startup orchestration script
├── test_agents_cli.py                # Automated CLI verification suite for Agents 1–5
├── test_auth_cli.py                  # Automated CLI test suite for Citizen & Officer Auth
├── test_department_dashboards_cli.py # Automated CLI test suite for Department Stats & RBAC
├── test_gemini_vision.py             # Gemini Multimodal AI verification test script
├── vercel.json                       # Root Vercel deployment configuration
│
├── app/                              # FASTAPI BACKEND & MULTI-AGENT ENGINE
│   ├── __init__.py
│   ├── main.py                       # FastAPI application entrypoint, CORS & middleware
│   │
│   ├── agents/                       # Autonomous Multi-Agent AI Engine (Agents 1 to 5)
│   │   ├── __init__.py
│   │   ├── intake.py                 # Agent 1: Multimodal Intake & NLP Hazard Classifier
│   │   ├── cluster.py                # Agent 2: DBSCAN Spatial Deduplication & Clustering
│   │   ├── priority.py               # Agent 3: Dynamic Severity & Urgency Scoring Engine
│   │   ├── dispatch.py               # Agent 4: Department Routing & SLA Dispatcher
│   │   └── verifier.py               # Agent 5: Adversarial Resolution Verification (Gemini AI)
│   │
│   ├── api/                          # REST API Layer
│   │   ├── __init__.py
│   │   ├── router.py                 # Central API router aggregating all endpoints
│   │   └── endpoints/                # Modular HTTP route controllers
│   │       ├── __init__.py
│   │       ├── analytics.py          # Dashboard analytics & fraud reduction statistics
│   │       ├── auth.py               # Citizen OTP login, Officer RBAC & session management
│   │       ├── clusters.py           # Cluster retrieval, map pins & audit trail retrieval
│   │       ├── complaints.py         # Citizen ticket intake & agent pipeline trigger
│   │       ├── departments.py        # Department-specific incident tables, sorting & filters
│   │       ├── health.py             # System health check & database liveness probe
│   │       ├── verification.py       # Resolution verification & proof auditing
│   │       └── voice.py              # Multilingual Groq Whisper voice intake & semantic parsing
│   │
│   ├── core/                         # Core Infrastructure & Cross-Cutting Concerns
│   │   ├── __init__.py
│   │   ├── auth.py                   # JWT token creation, decoding & cookie dependencies
│   │   ├── config.py                 # Pydantic BaseSettings loading from .env
│   │   ├── definitions.py            # Department schemas, categories, SLAs & tier thresholds
│   │   ├── otp.py                    # Mock & Twilio Verify OTP generation engines
│   │   └── security.py               # Password hashing (bcrypt) & verify functions
│   │
│   ├── db/                           # Database & ORM Layer
│   │   ├── __init__.py
│   │   ├── models.py                 # SQLAlchemy ORM models (User, Complaint, Cluster, AuditLog)
│   │   └── session.py                # Database engine, SessionLocal & Base declaration
│   │
│   ├── schemas/                      # Pydantic Request / Response Validation Schemas
│   │   ├── __init__.py
│   │   ├── analytics.py              # Schemas for analytics stats & metrics
│   │   ├── audit.py                  # Agent audit log schemas
│   │   ├── auth.py                   # Login, register, token, and user profile schemas
│   │   ├── cluster.py                # Cluster and map marker response schemas
│   │   ├── complaint.py              # Complaint submission schemas
│   │   ├── department.py             # Department dashboard & problem list schemas
│   │   ├── health.py                 # Health status response schema
│   │   └── verification.py           # Verification request & audit verdict schemas
│   │
│   └── services/                     # External Integration Services
│       └── voice.py                  # Groq Whisper API client & audio transcription
│
├── frontend/                         # NEXT.JS 14 FRONTEND (App Router, Tailwind CSS, Leaflet/Google Maps)
│   ├── .env.example                  # Frontend environment variables template
│   ├── .env.local                    # Local frontend environment variables (git-ignored)
│   ├── .gitignore                    # Frontend git ignore rules
│   ├── next.config.js                # Next.js build configuration & backend proxy rewrites
│   ├── package.json                  # Frontend dependencies and npm scripts
│   ├── package-lock.json             # Frontend npm lockfile
│   ├── postcss.config.js             # PostCSS plugins (Tailwind & Autoprefixer)
│   ├── tailwind.config.js            # Tailwind CSS styling tokens & design system
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   ├── vercel.json                   # Vercel deployment configuration for frontend directory
│   │
│   ├── public/                       # Static Assets & Fallback Media
│   │   └── uploads/                  # Seeded before/after inspection photos
│   │       ├── fake_closure_black.jpg
│   │       ├── genuine_closure_tar.jpg
│   │       ├── pothole_before.jpg
│   │       ├── streetlight_broken.jpg
│   │       └── water_leak_before.jpg
│   │
│   └── src/                          # Frontend Source Code
│       ├── middleware.ts             # Next.js Route Protection & Auth Middleware
│       │
│       ├── app/                      # Next.js 14 App Router Pages
│       │   ├── globals.css           # Global CSS, Tailwind directives & custom animations
│       │   ├── layout.tsx            # Root layout, fonts, AuthProvider & Navigation bar
│       │   ├── page.tsx              # Landing Home Page (Hero, Live Stats, Map Preview, Roles)
│       │   ├── dashboard/page.tsx    # Citizen Dashboard (My Tickets, Status Tracker, OTP Profile)
│       │   ├── login/page.tsx        # Unified Authentication Portal (Citizen OTP + Officer Login)
│       │   ├── officer/page.tsx      # City Commissioner Command Center (City-Wide Analytics)
│       │   ├── register/page.tsx     # Citizen Quick Registration Page
│       │   ├── report/page.tsx       # Multimodal Incident Reporting (Photo + Voice + GPS Map Pin)
│       │   │
│       │   ├── officer/department/[slug]/
│       │   │   └── page.tsx          # Department Officer Dashboard (Roads, Water, Lighting, Waste)
│       │   │
│       │   └── ticket/[id]/
│       │       └── page.tsx          # Real-Time Ticket Status & Audit Pipeline Timeline
│       │
│       ├── components/               # Modular UI Components
│       │   ├── CitizenLocationMap.tsx      # Interactive GPS map wrapper with dynamic loading
│       │   ├── CitizenLocationMapInner.tsx # Google Maps draggable pin locator component
│       │   ├── CitizenPortal.tsx           # Citizen ticket management & filter interface
│       │   ├── ClusterMap.tsx              # Spatial incident cluster map wrapper
│       │   ├── ClusterMapInner.tsx         # Google Maps cluster visualization with tier badges
│       │   ├── DepartmentProblemTable.tsx  # Department incident table with sorting, search & actions
│       │   ├── DepartmentStatCards.tsx     # KPI metric summary cards (Total, Solved, Pending, Today)
│       │   ├── LanguageToggle.tsx          # Multilingual toggle (English / Tamil / Hindi)
│       │   ├── Navbar.tsx                  # Responsive navigation bar with user status & quick links
│       │   ├── NotificationBell.tsx        # Real-time municipal notification dropdown
│       │   ├── OfficerDashboard.tsx        # Department officer incident management views
│       │   ├── OtpInput.tsx                # Auto-advancing 6-digit OTP code input component
│       │   ├── StatsOverview.tsx           # City-wide overview stat counters & duplicate reduction
│       │   ├── VerifierModal.tsx           # Proof-of-resolution upload & adversarial verification modal
│       │   └── XAIInspectorModal.tsx       # Explainable AI (XAI) transparent audit trail modal
│       │
│       ├── context/
│       │   └── AuthContext.tsx       # Global React Context for Citizen / Officer session state
│       │
│       ├── lib/                      # Frontend Utilities & API Integrations
│       │   ├── api.ts                # Axios API client for all backend endpoints & offline fallback
│       │   ├── defectImages.ts       # Defect image resolvers & stock preview fallbacks
│       │   ├── definitions.ts        # Municipal department definitions, slugs, SLAs & tier colors
│       │   ├── googleMaps.ts         # Google Maps script loader & React hook with safe error handling
│       │   ├── notifications.ts      # Browser notification helpers & mock event triggers
│       │   └── translations.ts       # Multilingual dictionary (English, Tamil, Hindi)
│       │
│       └── types/
│           └── index.ts              # Core TypeScript interfaces (User, Complaint, Cluster, Stats, etc.)
│
└── uploads/                          # Backend Upload Directory (User uploads & inspection images)
    ├── pothole_before.jpg            # Seeded demo defect photo (Pothole)
    ├── water_leak_before.jpg         # Seeded demo defect photo (Water Leakage)
    ├── streetlight_broken.jpg        # Seeded demo defect photo (Streetlight)
    ├── genuine_closure_tar.jpg       # Authentic asphalt repair proof photo
    └── fake_closure_black.jpg        # Adversarial fake proof photo (for testing AI rejection)
```

---

## 🏛️ Architectural Roles by Subsystem

### 1. Backend (`app/`)
* **Technology**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (production-compatible with PostgreSQL).
* **Role**: Serves the REST API (`/api/v1`), manages database operations, and powers the autonomous 5-Agent pipeline:
  * **Agent 1 (Intake)**: Evaluates uploaded defect photos & voice recordings, extracts category and severity.
  * **Agent 2 (Cluster)**: Computes spatial proximity (Haversine/DBSCAN) within 50 meters to merge duplicate reports.
  * **Agent 3 (Priority)**: Calculates dynamic priority score based on hazard weight, density, and time decay.
  * **Agent 4 (Dispatch)**: Automatically routes the cluster to the responsible municipal department and assigns SLA.
  * **Agent 5 (Verifier)**: Audits resolution proofs against GPS coordinates and uses Google Gemini Vision AI to verify physical repair.

### 2. Frontend (`frontend/`)
* **Technology**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Google Maps API, Axios, Lucide Icons.
* **Role**: Modern, responsive citizen and municipal officer portal:
  * **Citizen Portal**: Voice intake recording, photo upload, draggable GPS map pin, instant OTP verification, ticket tracking.
  * **Department Officer Portal**: Department-specific work order dashboards, priority ranking (Tier 1 > Tier 2 > Tier 3), search, filtering, and resolution proof submission with adversarial AI auditing.
  * **Commissioner Command Center**: Unified city-wide oversight, cross-department analytics, SLA compliance, and fraud prevention metrics.

### 3. Root Level Automation
* **`start_civictwin.bat` / `.sh`**: One-click scripts that install dependencies, seed the database, and launch both backend and frontend.
* **`seed_db.py`**: Creates demo users (citizens, department officers, commissioner) and pre-populates realistic municipal clusters.
* **`test_*_cli.py`**: Headless automated test suites that validate the entire agent pipeline, authentication system, and departmental RBAC.
* **`vercel.json`**: Pre-configured build pipelines for zero-friction Vercel deployments.
