from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Cluster, Complaint, WorkOrder

# Timezone definition (Asia/Kolkata UTC+05:30)
IST_TZ = ZoneInfo("Asia/Kolkata")

# Canonical Department Mapping
DEPARTMENT_MAP: Dict[str, Dict[str, str]] = {
    "roads": {
        "slug": "roads",
        "name": "Roads & Infrastructure Maintenance Wing",
        "name_ta": "சாலைகள் மற்றும் உள்கட்டமைப்பு துறை",
        "category": "Pothole",
        "incharge_username": "roads_officer",
    },
    "water": {
        "slug": "water",
        "name": "TWAD / Metro Water Supply Board",
        "name_ta": "குடிநீர் வடிகால் வாரியம்",
        "category": "Water Leakage",
        "incharge_username": "water_officer",
    },
    "electrical": {
        "slug": "electrical",
        "name": "Municipal Electrical & Lighting Dept",
        "name_ta": "மின்சாரம் மற்றும் தெருவிளக்கு துறை",
        "category": "Streetlight",
        "incharge_username": "electrical_officer",
    },
    "sanitation": {
        "slug": "sanitation",
        "name": "Solid Waste Management Division",
        "name_ta": "திடக்கழிவு மேலாண்மை பிரிவு",
        "category": "Garbage",
        "incharge_username": "sanitation_officer",
    },
}

# Solved / Closed statuses definition
SOLVED_STATUSES = {"CLOSED", "VERIFIED", "RESOLVED"}


def is_status_solved(status: str) -> bool:
    """Returns True if cluster status indicates solved / closed."""
    if not status:
        return False
    return status.strip().upper() in SOLVED_STATUSES


def is_status_pending(status: str) -> bool:
    """Returns True if cluster status is still pending / active."""
    return not is_status_solved(status)


def get_tier(priority_score: float) -> Dict[str, Any]:
    """
    Computes priority tier based on dynamic hazard priority score:
    - Tier 1 (Critical): >= 0.75
    - Tier 2 (Urgent): 0.45 <= score < 0.75
    - Tier 3 (Routine): < 0.45
    """
    if priority_score >= 0.75:
        return {"tier": "Tier 1 Critical", "tier_number": 1, "level": "CRITICAL"}
    elif priority_score >= 0.45:
        return {"tier": "Tier 2 Urgent", "tier_number": 2, "level": "URGENT"}
    else:
        return {"tier": "Tier 3 Routine", "tier_number": 3, "level": "ROUTINE"}


def get_ist_today_bounds() -> tuple[datetime, datetime]:
    """
    Computes today's 00:00:00 to 23:59:59.999999 calendar day window
    in Asia/Kolkata timezone, converted to UTC naive datetimes for SQLite comparison.
    """
    now_ist = datetime.now(IST_TZ)
    start_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    end_ist = now_ist.replace(hour=23, minute=5, second=59, microsecond=999999)

    # Convert to UTC naive for database timestamp comparison
    start_utc = start_ist.astimezone(timezone.utc).replace(tzinfo=None)
    end_utc = end_ist.astimezone(timezone.utc).replace(tzinfo=None)
    return start_utc, end_utc


def get_department_by_slug(slug: str) -> Optional[Dict[str, str]]:
    """Returns department metadata by canonical slug."""
    return DEPARTMENT_MAP.get(slug.lower())


def get_department_slug_by_name(dept_name: Optional[str]) -> Optional[str]:
    """Finds canonical slug for a given department name in database."""
    if not dept_name:
        return None
    for slug, d in DEPARTMENT_MAP.items():
        if d["name"].lower() in dept_name.lower() or dept_name.lower() in d["name"].lower():
            return slug
    return None
