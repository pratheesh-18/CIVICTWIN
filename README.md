# CivicTwin — Autonomous Multi-Agent Civic Grievance & Verification Platform

CivicTwin is an autonomous municipal governance system powered by a 5-Agent AI Collective (FastAPI) and a modern Next.js 14 frontend. It features citizen authentication, automated vernacular dialect parsing, spatial clustering, dynamic risk priority indexing, autonomous departmental routing, and adversarial 3-layer closure verification.

---

## 🏛️ Jurisdictional Department Routing & Admin Accounts

When a citizen submits a grievance via `/report` (or through the Citizen Portal), the multi-agent collective extracts their **Name**, **Complaint Description**, **GPS Coordinates**, calculates the **Dynamic Priority (0.10 - 0.98)**, and autonomously dispatches it to the respective municipal department admin.

### Demo Department Accounts

All departmental accounts use the default password: **`CivicAdmin@2026`**

| Department / Jurisdiction | Username (Login ID) | Password | Jurisdiction Scope |
|---|---|---|---|
| **Roads & Infrastructure** | `roads_officer` | `CivicAdmin@2026` | Potholes, asphalt damage, road craters |
| **Water & Drainage** | `water_officer` | `CivicAdmin@2026` | Pipe leaks, drinking water contamination, open drains |
| **Electrical & Lighting** | `electrical_officer` | `CivicAdmin@2026` | Broken streetlights, exposed live wires, damaged poles |
| **Sanitation & Waste** | `sanitation_officer` | `CivicAdmin@2026` | Overflowing garbage bins, roadside dumping |
| **City Commissioner** | `commissioner` | `CivicAdmin@2026` | **Full Oversight**: Inspects all departments & incidents |

### Demo Citizen Accounts
- **Anand**: Phone `9876543210` (Pre-seeded with active complaints in Anna Nagar, T. Nagar, and Adyar)
- **Priya**: Phone `9876543211` (Pre-seeded with active Streetlight complaint in Mylapore)
- **Karthik**: Phone `9876543212`
- **Mock OTP Code**: `123456` *(Valid for 5 minutes, 30s resend cooldown, 5 failed attempts lockout)*

---

## 🚀 Key Web Routes

| Route | Role Access | Description |
|---|---|---|
| `/` or `/login` | Public | Login portal with Citizen (Phone + 6-Digit OTP) and Department tabs |
| `/register` | Public | Citizen registration (Name + Mobile number only $\rightarrow$ OTP) |
| `/dashboard` | Citizen | Citizen command center: Greeting, My Complaints list, Department tiles |
| `/report` | Citizen | Issue reporting flow with preselected category from tiles |
| `/ticket/[id]` | Citizen | Ticket resolution tracking with AI decision audit trail |
| `/officer` | Commissioner | Commissioner City-Wide Overview with 4 department cards (redirects dept officers) |
| `/officer/department/[slug]` | Department / Commissioner | Incharge Department Dashboard with Stat Cards, Priority Table, and Leaflet Map |

---

## 📐 Mathematical & Domain Definitions

All metrics and priority orders are computed strictly on the backend with 100% database fidelity:

1. **Solved / Closed**:
   - Master problem status is closed: `status in ("CLOSED", "VERIFIED", "RESOLVED")`.
2. **Pending**:
   - Every status that is not closed: `status not in ("CLOSED", "VERIFIED", "RESOLVED")` (e.g. `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `NEEDS_REVIEW`, `REOPENED`).
3. **"Today" (Asia/Kolkata Calendar Day)**:
   - Evaluated strictly using server timezone `Asia/Kolkata` (00:00:00 to 23:59:59 IST).
   - `today_received`: New problems created within today's IST window.
   - `resolved_today`: Problems marked resolved within today's IST window.
4. **Unique Problems vs. Raw Reports**:
   - Every metric card counts **Unique Master Problems** (`clusters`).
   - The supporting line on each card displays `"from X citizen reports"` (sum of all merged citizen complaints).
5. **Priority Ordering Formula**:
   - Problems are ordered strictly by:
     1. `tier_number ASC` (Tier 1 Critical first, then Tier 2 Urgent, then Tier 3 Routine)
     2. `priority_score DESC` (highest risk score first)
     3. `sla_due ASC` (SLA due soonest first)

---

## ⚙️ Configuration & Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `OTP_PROVIDER` | `mock` | Selects OTP provider (`mock` or `twilio_verify`) |
| `DEMO_MODE` | `True` | In demo mode, OTP `123456` is logged to server console |
| `DEMO_DEPT_PASSWORD`| `CivicAdmin@2026` | Default password for departmental staff |
| `SECRET_KEY` | `civictwin-secret-...` | Secret key used for signing JWT sessions and OTP hashes |
| `SESSION_COOKIE_NAME`| `civictwin_session` | Name of the HTTP-only secure session cookie |

---

## 🧪 Automated Test Suites

1. **5-Agent Verification Smoke Tests**:
   ```bash
   python test_agents_cli.py
   ```
2. **Authentication & RBAC Security Suite**:
   ```bash
   python test_auth_cli.py
   ```
3. **Department Dashboards & Stats Integrity Suite**:
   ```bash
   python test_department_dashboards_cli.py
   ```

---

## 📚 Supplementary Documentation

* **[Complete Project Folder Structure](file:///d:/Hackathon/CIVIC_KPR/PROJECT_STRUCTURE.md)**: Full ASCII directory tree and module map.
* **[Production & Vercel Deployment Guide](file:///d:/Hackathon/CIVIC_KPR/DEPLOYMENT.md)**: Cloud hosting instructions, environment variables & Vercel setup.
* **[How CivicTwin Works](file:///d:/Hackathon/CIVIC_KPR/HOW_IT_WORKS.md)**: Multi-agent pipeline specifications and verification lifecycle.
* **[Architecture & Progress](file:///d:/Hackathon/CIVIC_KPR/PROJECT_PROGRESS_AND_ARCHITECTURE.md)**: Technical design, algorithms & benchmarks.

