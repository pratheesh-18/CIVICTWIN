from pydantic import BaseModel, ConfigDict


class AnalyticsStatsResponse(BaseModel):
    total_complaints: int
    active_clusters: int
    verified_closures: int
    fraud_prevented_count: int
    duplicate_reduction_pct: float

    model_config = ConfigDict(from_attributes=True)
