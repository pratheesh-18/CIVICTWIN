import json
import os
import uuid
from typing import Optional
import aiofiles
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user_optional
from app.db.models import Complaint, Cluster, WorkOrder, AgentAuditLog, User
from app.agents.intake import run_intake_agent
from app.agents.cluster import run_cluster_agent
from app.agents.priority import run_priority_agent
from app.agents.dispatch import run_dispatch_agent
from app.schemas.complaint import ComplaintSubmitResponse

router = APIRouter()


@router.post("/submit", response_model=ComplaintSubmitResponse)
async def submit_complaint(
    citizen_name: str = Form(...),
    text: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ComplaintSubmitResponse:
    """
    Submits a new citizen complaint, runs Agent 1 -> Agent 2 -> Agent 3 -> Agent 4,
    persists audit logs and records, and returns full agent trace.
    """
    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_filepath = os.path.join("uploads", unique_filename)

    async with aiofiles.open(saved_filepath, "wb") as out_file:
        content = await image.read()
        await out_file.write(content)

    image_url = f"/uploads/{unique_filename}"

    # Agent 1: Intake Agent
    intake_res = run_intake_agent(text=text, filename=image.filename or "")
    category = intake_res["category"]
    severity = intake_res["severity"]
    hazard_weight = intake_res["hazard_weight"]

    # Agent 2: Spatial Clustering Agent
    cluster_id, is_new_cluster, report_count = run_cluster_agent(
        db=db, lat=latitude, lon=longitude, category=category
    )

    # Agent 3: Dynamic Priority Scoring Agent
    priority_score = run_priority_agent(
        db=db, cluster_id=cluster_id, hazard_weight=hazard_weight
    )

    # Agent 4: Department Dispatch Agent
    assigned_dept, sla_hours = run_dispatch_agent(
        category=category, priority_score=priority_score
    )

    # Update Cluster with dispatch details
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if cluster:
        cluster.assigned_dept = assigned_dept
        cluster.sla_hours = sla_hours
        cluster.priority_score = priority_score

    # Create Complaint record (attach user_id if authenticated)
    assigned_name = current_user.name if (current_user and current_user.name) else citizen_name
    complaint = Complaint(
        citizen_name=assigned_name,
        user_id=current_user.id if current_user else None,
        raw_text=text,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        category=category,
        severity=severity,
        cluster_id=cluster_id,
    )
    db.add(complaint)
    db.flush()

    # Ensure associated WorkOrder exists
    work_order = db.query(WorkOrder).filter(WorkOrder.cluster_id == cluster_id).first()
    if not work_order:
        work_order = WorkOrder(
            cluster_id=cluster_id,
            assigned_contractor="City Civil Works Pvt Ltd",
            contractor_trust_score=100.0,
            before_image=image_url,
            before_latitude=latitude,
            before_longitude=longitude,
            verification_status="PENDING",
        )
        db.add(work_order)

    # Log 4 Agent Audit Trail entries
    audit_logs = [
        AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 1 - Intake Agent",
            input_data=json.dumps({"text": text, "filename": image.filename}),
            decision_output=json.dumps(intake_res),
            confidence_score=0.92,
        ),
        AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 2 - Spatial Clustering Agent",
            input_data=json.dumps({"lat": latitude, "lon": longitude, "category": category}),
            decision_output=json.dumps({"cluster_id": cluster_id, "is_new_cluster": is_new_cluster, "report_count": report_count}),
            confidence_score=0.95,
        ),
        AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 3 - Priority Scoring Agent",
            input_data=json.dumps({"cluster_id": cluster_id, "hazard_weight": hazard_weight, "report_count": report_count}),
            decision_output=json.dumps({"priority_score": priority_score}),
            confidence_score=0.90,
        ),
        AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 4 - Department Dispatch Agent",
            input_data=json.dumps({"category": category, "priority_score": priority_score}),
            decision_output=json.dumps({"assigned_dept": assigned_dept, "sla_hours": sla_hours}),
            confidence_score=0.98,
        ),
    ]

    for log in audit_logs:
        db.add(log)

    db.commit()
    db.refresh(complaint)

    agent_trace = [
        f"Agent 1 (Intake): Categorized as '{category}', Severity: '{severity}' (Hazard Weight: {hazard_weight})",
        f"Agent 2 (Clustering): {'Created new' if is_new_cluster else 'Merged into existing'} Cluster #{cluster_id} (Total Reports: {report_count})",
        f"Agent 3 (Priority): Assigned Priority Score {priority_score}",
        f"Agent 4 (Dispatch): Dispatched to '{assigned_dept}' with SLA {sla_hours}h",
    ]

    return ComplaintSubmitResponse(
        complaint_id=complaint.id,
        cluster_id=cluster_id,
        is_new_cluster=is_new_cluster,
        category=category,
        severity=severity,
        priority_score=priority_score,
        assigned_dept=assigned_dept,
        report_count=report_count,
        sla_hours=sla_hours,
        agent_trace=agent_trace,
    )
