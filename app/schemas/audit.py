from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AgentAuditLogResponse(BaseModel):
    id: int
    cluster_id: Optional[int] = None
    agent_name: str
    input_data: str
    decision_output: str
    confidence_score: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
