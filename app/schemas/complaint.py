from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ComplaintResponse(BaseModel):
    id: int
    citizen_name: str
    category: str
    severity: str
    cluster_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintSubmitResponse(BaseModel):
    complaint_id: int
    cluster_id: int
    is_new_cluster: bool
    category: str
    severity: str
    priority_score: float
    assigned_dept: str
    report_count: int
    sla_hours: int
    agent_trace: List[str]

    model_config = ConfigDict(from_attributes=True)
