# CivicTwin: How It Works & Architecture Specification

## 1. Executive Summary
CivicTwin is an autonomous, agentic civic operations platform that routes, prioritizes, and verifies municipal infrastructure grievances across 4 core city wings:
- **Roads & Infrastructure Maintenance Wing**
- **Water & Drainage Management Wing**
- **Electrical & Public Lighting Wing**
- **Sanitation & Solid Waste Wing**

---

## 2. The 5 Autonomous Agents Pipeline

```text
[Citizen Grievance Submission]
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ 🗣️ AGENT 1: VERNACULAR INTAKE AGENT                     │
│ • Multilingual NLP (Tamil/English) extraction           │
│ • Category Classification & Initial Severity Score      │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ 📍 AGENT 2: SPATIAL DEDUPLICATION & CLUSTERING AGENT    │
│ • Spatial proximity check (Radius ≤ 50m)                │
│ • Merges duplicate citizen complaints into Master Cluster│
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ ⚖️ AGENT 3: DYNAMIC RISK PRIORITY & HAZARD TIERS        │
│ • Score = (0.4 * Severity) + (0.3 * Cluster Count) +    │
│           (0.2 * Location Vulnerability) + (0.1 * Age)  │
│ • Escalation increases on top of previous priority      │
│ • Hazard Tiers: Tier 1 (Critical), Tier 2, Tier 3       │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ 🚀 AGENT 4: AUTONOMOUS DISPATCH & SLA ENGINE            │
│ • Routes to Jurisdictional Department Wing              │
│ • Sets Dynamic SLA (24h Critical, 48h Standard)         │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│ 🛡️ AGENT 5: ADVERSARIAL RESOLUTION AUDITING AGENT        │
│ • Dual-Layer Ground-Truth Integrity Pipeline:           │
│   1. Geo-Fence Location Audit (Radius ≤ 50.0m)          │
│   2. Gemini Multimodal Vision AI Defect Resolution Diff │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Deep Dive into Agent 5: Adversarial Resolution Auditing Engine

When a field officer or management submits proof of completed work ("After Photo"), Agent 5 executes an adversarial audit before certifying closure:

### 🔹 Layer 1: Geo-Fence Distance Check (50m Radius)
- **Live Location Capture**: Management coordinates are **not defaulted** to citizen coordinates. Management must turn on device GPS or acquire coordinates at the repair site.
- **Calculation**: $\Delta d = \text{Haversine}(\text{Citizen GPS}, \text{Management GPS})$
- **Condition**: $\Delta d \le 50.0$ meters
- **Fraud Interception**: If $\Delta d > 50.0$m, Status `REJECTED`, Reason: *"Off-Site Capture Fraud: Photo taken away from defect coordinates (> 50.0m)"*.

### 🔹 Layer 2: Multimodal AI Visual Resolution Analysis (Gemini Vision AI)
- **Before vs After Inspection**: Gemini Multimodal Vision AI analyzes both the original complaint defect photo and the submitted resolution photo.
- **Ground-Truth Verification**: Verifies that the specific civic defect (e.g. pothole filled with asphalt, garbage cleared, water pipe leak repaired) is **genuinely solved**.
- **Fraud Interception**: If after photo is black/blank, corrupted, or shows the still-unfixed defect or unrelated office/desk pictures, status is `REJECTED`.

### 🔹 Freedom of Operational Dispatch
- Field management can select and work on **any priority problem** (Tier 1 Critical, Tier 2 Urgent, or Tier 3 Routine).
- The system **does not automatically reset or override** the officer's selection back to high priority when low priority work is being executed.

#### Outcomes:
- ❌ **ANY FAILS (Fraud Intercepted)**:
  - Status: `REOPENED`
  - Contractor Trust Score: **-10 Penalty**
  - Violation logged in `AgentAuditLog` for City Commissioner inspection.
- ✅ **ALL PASS (Certified Ground-Truth)**:
  - Status: `CLOSED (VERIFIED)`
  - Contractor Trust Score: **+2 Reward** (capped at 100%)
  - Work order permanently sealed.

---

## 4. Verification CLI Commands
Run the automated test suites:
```bash
python test_agents_cli.py
python test_department_dashboards_cli.py
python test_auth_cli.py
```
