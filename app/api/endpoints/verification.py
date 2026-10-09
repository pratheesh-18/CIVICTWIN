import json
import os
import uuid
from typing import Optional
import aiofiles
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import get_current_user_optional
from app.db.models import Cluster, WorkOrder, AgentAuditLog, User
from app.agents.verifier import run_adversarial_verification_agent
from app.schemas.verification import VerificationResponse

router = APIRouter()


@router.post("/verify-workorder", response_model=VerificationResponse)
async def verify_work_order(
    cluster_id: int = Form(...),
    gyro_tilt: Optional[float] = Form(0.0),
    after_image: UploadFile = File(...),
    officer_lat: Optional[float] = Form(None),
    officer_lon: Optional[float] = Form(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> VerificationResponse:
    """
    Submits completed work order proof (after_image, camera gyro_tilt, and officer GPS),
    runs Agent 5 3-Tier Adversarial Verification inspection, and certifies closure or flags fraud.
    Restricted to department officers and commissioner.
    """
    if current_user and current_user.role == "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Citizens cannot perform work order verification closures.",
        )
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster #{cluster_id} not found",
        )

    work_order = db.query(WorkOrder).filter(WorkOrder.cluster_id == cluster_id).first()
    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Work Order found for Cluster #{cluster_id}",
        )

    # Save after_image
    os.makedirs("uploads", exist_ok=True)
    filename = after_image.filename or "after_image.jpg"
    file_ext = os.path.splitext(filename)[1] or ".jpg"
    unique_filename = f"after_{uuid.uuid4().hex}{file_ext}"
    saved_filepath = os.path.join("uploads", unique_filename)

    content = await after_image.read()
    file_size = len(content)

    async with aiofiles.open(saved_filepath, "wb") as out_file:
        await out_file.write(content)

    after_image_url = f"/uploads/{unique_filename}"

    # Determine coordinates for Layer 1 Geo-Fence check
    before_lat = work_order.before_latitude if work_order.before_latitude is not None else cluster.latitude
    before_lon = work_order.before_longitude if work_order.before_longitude is not None else cluster.longitude

    # Run Agent 5: 3-Tier Adversarial Verification Engine
    verif_res = run_adversarial_verification_agent(
        category=cluster.category,
        gyro_tilt=gyro_tilt,
        filename=filename,
        file_size=file_size,
        before_lat=before_lat,
        before_lon=before_lon,
        after_lat=officer_lat,
        after_lon=officon if (officon := officer_lon) is not None else None,
        image_bytes=content,
        before_image_path=work_order.before_image,
    )

    status_code = verif_res["status"]
    reason = verif_res["reason"]
    layer_failed = verif_res.get("layer_failed")

    work_order.after_image = after_image_url
    work_order.gyro_tilt = gyro_tilt
    if officer_lat is not None and officer_lon is not None:
        work_order.after_latitude = officer_lat
        work_order.after_longitude = officer_lon

    if status_code == "REJECTED":
        cluster.status = "REOPENED"
        work_order.verification_status = "REJECTED"
        work_order.contractor_trust_score = max(0.0, work_order.contractor_trust_score - 10.0)
        work_order.rejection_reason = reason

        audit_log = AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 5 - Adversarial Verification Agent (FRAUD_INTERCEPTED)",
            input_data=json.dumps(
                {
                    "cluster_id": cluster_id,
                    "gyro_tilt": gyro_tilt,
                    "officer_lat": officer_lat,
                    "officer_lon": officer_lon,
                    "filename": filename,
                    "file_size": file_size,
                }
            ),
            decision_output=json.dumps(verif_res),
            confidence_score=0.99,
        )
        db.add(audit_log)

    else:  # VERIFIED
        cluster.status = "CLOSED"
        work_order.verification_status = "VERIFIED"
        work_order.contractor_trust_score = min(100.0, work_order.contractor_trust_score + 2.0)
        work_order.rejection_reason = None

        audit_log = AgentAuditLog(
            cluster_id=cluster_id,
            agent_name="Agent 5 - Adversarial Verification Agent (CLOSURE_CERTIFIED)",
            input_data=json.dumps(
                {
                    "cluster_id": cluster_id,
                    "gyro_tilt": gyro_tilt,
                    "officer_lat": officer_lat,
                    "officer_lon": officer_lon,
                    "filename": filename,
                    "file_size": file_size,
                }
            ),
            decision_output=json.dumps(verif_res),
            confidence_score=0.99,
        )
        db.add(audit_log)

    db.commit()
    db.refresh(cluster)
    db.refresh(work_order)

    return VerificationResponse(
        status=status_code,
        reason=reason,
        layer_failed=layer_failed,
        updated_cluster_status=cluster.status,
        contractor_trust_score=work_order.contractor_trust_score,
    )
