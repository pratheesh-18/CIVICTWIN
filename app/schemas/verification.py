from typing import Optional
from pydantic import BaseModel, ConfigDict


class VerificationResponse(BaseModel):
    status: str
    reason: str
    layer_failed: Optional[str] = None
    updated_cluster_status: str
    contractor_trust_score: float

    model_config = ConfigDict(from_attributes=True)
