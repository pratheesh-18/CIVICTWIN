from datetime import datetime
from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    app_name: str
    database_connected: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
