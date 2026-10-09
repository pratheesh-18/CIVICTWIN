from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Complaint, Cluster, WorkOrder
from app.schemas.analytics import AnalyticsStatsResponse

router = APIRouter()


@router.get("/stats", response_model=AnalyticsStatsResponse)
def get_analytics_stats(db: Session = Depends(get_db)) -> AnalyticsStatsResponse:
    """
    Returns platform-wide analytical metrics including complaints count, active clusters,
    verified closures, fraud prevented count, and duplicate reduction percentage.
    """
    total_complaints = db.query(Complaint).count()
    active_clusters = db.query(Cluster).filter(Cluster.status.in_(["OPEN", "REOPENED"])).count()
    verified_closures = db.query(Cluster).filter(Cluster.status == "VERIFIED").count()
    fraud_prevented_count = db.query(WorkOrder).filter(WorkOrder.verification_status == "REJECTED").count()

    total_clusters = db.query(Cluster).count()
    if total_complaints > 0:
        duplicates_eliminated = max(0, total_complaints - total_clusters)
        duplicate_reduction_pct = round((duplicates_eliminated / total_complaints) * 100.0, 2)
    else:
        duplicate_reduction_pct = 0.0

    return AnalyticsStatsResponse(
        total_complaints=total_complaints,
        active_clusters=active_clusters,
        verified_closures=verified_closures,
        fraud_prevented_count=fraud_prevented_count,
        duplicate_reduction_pct=duplicate_reduction_pct,
    )
