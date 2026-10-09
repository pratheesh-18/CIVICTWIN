from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DepartmentStatCards(BaseModel):
    department_name: str
    slug: str
    overall_registered: int  # Overall complaints registered in this department
    total_solved: int        # Total solved complaints
    today_received: int      # Complaints come today (Asia/Kolkata day)
    pending: int             # Currently pending / open complaints
    resolution_rate_pct: float
    overdue: int
    total_reports: int       # Total merged citizen reports

    model_config = ConfigDict(from_attributes=True)


class OverviewStatsResponse(BaseModel):
    city_totals: DepartmentStatCards
    departments: List[DepartmentStatCards]


class DepartmentProblemItem(BaseModel):
    rank: int
    id: int
    title: str
    category: str
    citizen_name: str
    complaint_text: str
    tier: str
    tier_number: int
    priority_score: float
    report_count: int
    latitude: float
    longitude: float
    location_name: str
    created_at: datetime
    age_text: str
    sla_hours: int
    sla_due: datetime
    sla_remaining_hours: float
    is_overdue: bool
    status: str
    before_image: Optional[str] = None
    after_image: Optional[str] = None
    assigned_dept: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentProblemsResponse(BaseModel):
    department_name: str
    slug: str
    problems: List[DepartmentProblemItem]
    total_count: int
    page: int
    page_size: int
    total_pages: int
