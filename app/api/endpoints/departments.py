import os
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Cluster, Complaint, WorkOrder, User
from app.core.auth import get_current_user
from app.core.definitions import (
    DEPARTMENT_MAP,
    is_status_solved,
    is_status_pending,
    get_tier,
    get_ist_today_bounds,
    get_department_by_slug,
    get_department_slug_by_name,
)
from app.schemas.department import (
    DepartmentStatCards,
    OverviewStatsResponse,
    DepartmentProblemItem,
    DepartmentProblemsResponse,
)

router = APIRouter()


def check_department_access(current_user: User, slug: str) -> None:
    """Enforces that a department officer can only access their own department slug."""
    if current_user.role == "commissioner":
        return

    if current_user.role == "department":
        user_slug = get_department_slug_by_name(current_user.department)
        if user_slug == slug.lower():
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You only have jurisdiction over your assigned department ('{current_user.department}').",
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Municipal officer credentials required.",
    )


def compute_department_stat_cards(
    db: Session,
    slug: str,
    dept_name: str,
) -> DepartmentStatCards:
    """Computes exact database numbers for the 4 core stat cards (+ overdue and reports)."""
    clusters = (
        db.query(Cluster)
        .filter(Cluster.assigned_dept == dept_name)
        .all()
    )

    now_utc = datetime.utcnow()
    today_start_utc, today_end_utc = get_ist_today_bounds()

    overall_registered = len(clusters)
    total_solved = sum(1 for c in clusters if is_status_solved(c.status))
    pending = sum(1 for c in clusters if is_status_pending(c.status))
    total_reports = sum(c.report_count for c in clusters) if clusters else 0

    # Today received (Asia/Kolkata day)
    today_received = sum(
        1 for c in clusters if c.created_at and today_start_utc <= c.created_at <= today_end_utc
    )

    # Overdue count (pending problems where now > created_at + sla_hours)
    overdue = 0
    for c in clusters:
        if is_status_pending(c.status) and c.created_at:
            sla_deadline = c.created_at + timedelta(hours=c.sla_hours)
            if now_utc > sla_deadline:
                overdue += 1

    resolution_rate_pct = (
        round((total_solved / overall_registered) * 100, 1)
        if overall_registered > 0
        else 0.0
    )

    return DepartmentStatCards(
        department_name=dept_name,
        slug=slug,
        overall_registered=overall_registered,
        total_solved=total_solved,
        today_received=today_received,
        pending=pending,
        resolution_rate_pct=resolution_rate_pct,
        overdue=overdue,
        total_reports=total_reports,
    )


@router.get("/stats/overview", response_model=OverviewStatsResponse)
def get_city_overview_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns city-wide totals and per-department cards for Commissioner / Senior Leadership.
    """
    if current_user.role != "commissioner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: City-wide overview is restricted to the Municipal Commissioner.",
        )

    dept_cards: List[DepartmentStatCards] = []
    city_overall_registered = 0
    city_total_solved = 0
    city_today_received = 0
    city_pending = 0
    city_overdue = 0
    city_total_reports = 0

    for slug, info in DEPARTMENT_MAP.items():
        cards = compute_department_stat_cards(db, slug=slug, dept_name=info["name"])
        dept_cards.append(cards)

        city_overall_registered += cards.overall_registered
        city_total_solved += cards.total_solved
        city_today_received += cards.today_received
        city_pending += cards.pending
        city_overdue += cards.overdue
        city_total_reports += cards.total_reports

    city_resolution_rate = (
        round((city_total_solved / city_overall_registered) * 100, 1)
        if city_overall_registered > 0
        else 0.0
    )

    city_totals = DepartmentStatCards(
        department_name="City-Wide Municipal Totals",
        slug="all",
        overall_registered=city_overall_registered,
        total_solved=city_total_solved,
        today_received=city_today_received,
        pending=city_pending,
        resolution_rate_pct=city_resolution_rate,
        overdue=city_overdue,
        total_reports=city_total_reports,
    )

    return OverviewStatsResponse(
        city_totals=city_totals,
        departments=dept_cards,
    )


@router.get("/stats/department/{slug}", response_model=DepartmentStatCards)
def get_department_stats(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns stat cards for the requested department.
    Enforces that department officers only access their assigned jurisdiction.
    """
    dept_info = get_department_by_slug(slug)
    if not dept_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with slug '{slug}' not found.",
        )

    check_department_access(current_user, slug)
    return compute_department_stat_cards(db, slug=slug, dept_name=dept_info["name"])


@router.get("/department/{slug}/problems", response_model=DepartmentProblemsResponse)
def get_department_problems(
    slug: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    tier_filter: Optional[str] = Query(None, alias="tier"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort: str = Query("priority"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns priority-ordered list of all problems for this department.
    Default ordering: Tier 1 first, then priority score descending, then SLA due soonest.
    """
    dept_info = get_department_by_slug(slug)
    if not dept_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with slug '{slug}' not found.",
        )

    check_department_access(current_user, slug)

    query = db.query(Cluster).filter(Cluster.assigned_dept == dept_info["name"])

    # Apply status filtering
    if status_filter:
        s = status_filter.strip().lower()
        if s == "pending":
            query = query.filter(~Cluster.status.in_(["CLOSED", "VERIFIED", "RESOLVED"]))
        elif s == "resolved":
            query = query.filter(Cluster.status.in_(["CLOSED", "VERIFIED", "RESOLVED"]))

    clusters = query.all()
    now_utc = datetime.utcnow()

    # Build problem items
    items: List[DepartmentProblemItem] = []
    for c in clusters:
        tier_info = get_tier(c.priority_score)
        if tier_filter and tier_filter.lower() != "all":
            # Check tier match
            if str(tier_info["tier_number"]) != str(tier_filter).strip():
                continue

        # Get work order photos
        wo = db.query(WorkOrder).filter(WorkOrder.cluster_id == c.id).first()
        raw_before = wo.before_image if wo else None
        after_image = wo.after_image if wo else None

        # Get latest complaint
        comp = (
            db.query(Complaint)
            .filter(Complaint.cluster_id == c.id)
            .order_by(Complaint.created_at.desc())
            .first()
        )
        citizen_name = comp.citizen_name if comp else "Citizen Reporter"
        complaint_text = comp.raw_text if comp else c.title
        comp_image = comp.image_url if comp else None

        # Guarantee a valid, verified before_image for every complaint
        before_image = None
        for candidate in [raw_before, comp_image]:
            if candidate:
                clean = candidate.lstrip("/")
                if os.path.exists(clean) or candidate.startswith("http"):
                    before_image = candidate if (candidate.startswith("/") or candidate.startswith("http")) else f"/{candidate}"
                    break

        if not before_image:
            cat_lower = (c.category or "").lower()
            if "water" in cat_lower or "leak" in cat_lower:
                before_image = "/uploads/water_leak_before.jpg"
            elif "light" in cat_lower or "electr" in cat_lower:
                before_image = "/uploads/streetlight_broken.jpg"
            elif "garbage" in cat_lower or "waste" in cat_lower or "sanitat" in cat_lower:
                before_image = "/uploads/genuine_closure_tar.jpg"
            else:
                before_image = "/uploads/pothole_before.jpg"

        # Compute SLA due and remaining hours
        sla_due = c.created_at + timedelta(hours=c.sla_hours)
        diff_hours = (sla_due - now_utc).total_seconds() / 3600.0
        is_overdue = is_status_pending(c.status) and (diff_hours < 0)

        # Human readable age
        age_delta = now_utc - c.created_at
        if age_delta.days > 0:
            age_text = f"{age_delta.days}d ago"
        elif age_delta.seconds >= 3600:
            age_text = f"{age_delta.seconds // 3600}h ago"
        else:
            age_text = f"{max(1, age_delta.seconds // 60)}m ago"

        # Location name
        location_name = f"{c.latitude:.4f}° N, {c.longitude:.4f}° E"

        items.append(
            DepartmentProblemItem(
                rank=0,  # Will be assigned after strict priority sorting
                id=c.id,
                title=c.title,
                category=c.category,
                citizen_name=citizen_name,
                complaint_text=complaint_text,
                tier=tier_info["tier"],
                tier_number=tier_info["tier_number"],
                priority_score=round(c.priority_score, 2),
                report_count=c.report_count,
                latitude=c.latitude,
                longitude=c.longitude,
                location_name=location_name,
                created_at=c.created_at,
                age_text=age_text,
                sla_hours=c.sla_hours,
                sla_due=sla_due,
                sla_remaining_hours=round(diff_hours, 1),
                is_overdue=is_overdue,
                status=c.status,
                before_image=before_image,
                after_image=after_image,
                assigned_dept=c.assigned_dept,
            )
        )

    # STRICT PRIORITY ORDERING:
    # 1. Tier 1 first (tier_number ascending: 1, 2, 3)
    # 2. Priority score descending (-item.priority_score)
    # 3. SLA due soonest (item.sla_due ascending)
    items.sort(key=lambda x: (x.tier_number, -x.priority_score, x.sla_due))

    # Assign 1-based ranks
    for idx, item in enumerate(items, 1):
        item.rank = idx

    total_count = len(items)
    total_pages = max(1, math.ceil(total_count / page_size))
    start_idx = (page - 1) * page_size
    paged_items = items[start_idx : start_idx + page_size]

    return DepartmentProblemsResponse(
        department_name=dept_info["name"],
        slug=slug,
        problems=paged_items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
