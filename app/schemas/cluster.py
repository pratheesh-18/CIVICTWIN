from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ClusterResponse(BaseModel):
    id: int
    title: str
    category: str
    latitude: float
    longitude: float
    report_count: int
    priority_score: float
    status: str
    assigned_dept: Optional[str] = None
    sla_hours: int
    before_image: Optional[str] = None
    citizen_name: Optional[str] = None
    complaint_text: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
