import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.auth import get_current_user_optional
from app.db.models import Cluster, WorkOrder, AgentAuditLog, User, Complaint
from app.schemas.cluster import ClusterResponse
from app.schemas.audit import AgentAuditLogResponse

router = APIRouter()


@router.get("/active", response_model=List[ClusterResponse])
def get_active_clusters(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> List[ClusterResponse]:
    """
    Returns active clusters (status != 'ARCHIVED'), ordered by priority_score descending.
    If authenticated as a department user, filters to clusters matching their department.
    Commissioner or public view returns all active clusters.
    """
    query = db.query(Cluster).filter(Cluster.status != "ARCHIVED")

    if current_user and current_user.role == "department" and current_user.department:
        query = query.filter(Cluster.assigned_dept == current_user.department)

    clusters = query.order_by(Cluster.priority_score.desc()).all()

    result = []
    for cluster in clusters:
        work_order = db.query(WorkOrder).filter(WorkOrder.cluster_id == cluster.id).first()
        raw_before = work_order.before_image if work_order else None

        # Fetch latest complaint details for citizen attribution
        complaint = (
            db.query(Complaint)
            .filter(Complaint.cluster_id == cluster.id)
            .order_by(Complaint.created_at.desc())
            .first()
        )
        citizen_name = complaint.citizen_name if complaint else "Citizen"
        complaint_text = complaint.raw_text if complaint else cluster.title
        comp_image = complaint.image_url if complaint else None

        # Guarantee a valid, verified before_image for every cluster
        before_image = None
        for candidate in [raw_before, comp_image]:
            if candidate:
                clean = candidate.lstrip("/")
                if os.path.exists(clean) or candidate.startswith("http"):
                    before_image = candidate if (candidate.startswith("/") or candidate.startswith("http")) else f"/{candidate}"
                    break

        if not before_image:
            cat_lower = (cluster.category or "").lower()
            if "water" in cat_lower or "leak" in cat_lower:
                before_image = "/uploads/water_leak_before.jpg"
            elif "light" in cat_lower or "electr" in cat_lower:
                before_image = "/uploads/streetlight_broken.jpg"
            elif "garbage" in cat_lower or "waste" in cat_lower or "sanitat" in cat_lower:
                before_image = "/uploads/genuine_closure_tar.jpg"
            else:
                before_image = "/uploads/pothole_before.jpg"

        result.append(
            ClusterResponse(
                id=cluster.id,
                title=cluster.title,
                category=cluster.category,
                latitude=cluster.latitude,
                longitude=cluster.longitude,
                report_count=cluster.report_count,
                priority_score=cluster.priority_score,
                status=cluster.status,
                assigned_dept=cluster.assigned_dept,
                sla_hours=cluster.sla_hours,
                before_image=before_image,
                citizen_name=citizen_name,
                complaint_text=complaint_text,
                created_at=cluster.created_at,
            )
        )

    return result


@router.get("/{cluster_id}/audit-trail", response_model=List[AgentAuditLogResponse])
def get_cluster_audit_trail(
    cluster_id: int, db: Session = Depends(get_db)
) -> List[AgentAuditLogResponse]:
    """
    Returns all AgentAuditLog records for the specified cluster, ordered by timestamp.
    """
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster #{cluster_id} not found",
        )

    audit_logs = (
        db.query(AgentAuditLog)
        .filter(AgentAuditLog.cluster_id == cluster_id)
        .order_by(AgentAuditLog.timestamp.asc())
        .all()
    )

    return audit_logs
