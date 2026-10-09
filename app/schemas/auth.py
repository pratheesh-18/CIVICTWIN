from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)


class OtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class CitizenLoginRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    code: str = Field(..., min_length=4, max_length=10)


class DepartmentLoginRequest(BaseModel):
    username: str = Field(..., min_length=2)
    password: str = Field(..., min_length=3)


class UserResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    username: Optional[str] = None
    role: str
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CitizenTicketItem(BaseModel):
    ticket_id: int
    category: str
    severity: str
    raw_text: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    status: str
    master_cluster_id: Optional[int] = None
    master_cluster_status: Optional[str] = None
    assigned_dept: Optional[str] = None
    sla_hours: int = 24
    cluster_report_count: int = 1
    created_at: datetime


class CitizenTicketsResponse(BaseModel):
    tickets: List[CitizenTicketItem]
    total_count: int
    category_counts: Dict[str, int]
