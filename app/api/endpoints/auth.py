from collections import Counter
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    normalize_phone,
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.otp import generate_and_store_otp, verify_stored_otp
from app.core.auth import (
    get_current_user,
    require_citizen,
    set_auth_cookie,
    clear_auth_cookie,
)
from app.db.session import get_db
from app.db.models import User, Complaint, Cluster
from app.schemas.auth import (
    RegisterRequest,
    OtpRequest,
    CitizenLoginRequest,
    OtpVerifyRequest,
    DepartmentLoginRequest,
    UserResponse,
    CitizenTicketItem,
    CitizenTicketsResponse,
)

router = APIRouter()


@router.post("/register")
def register(
    req: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Registers a citizen with Name and Mobile number.
    Normalises phone to E.164 (+91XXXXXXXXXX) and triggers OTP.
    """
    try:
        norm_phone = normalize_phone(req.phone)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    existing_user = db.query(User).filter(User.phone == norm_phone).first()
    if existing_user:
        if existing_user.is_verified:
            # Already registered & verified; prompt them to log in or resend OTP
            success, msg = generate_and_store_otp(db, norm_phone)
            if not success:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)
            return {
                "success": True,
                "already_registered": True,
                "phone": norm_phone,
                "message": "Account already exists. An OTP has been sent for verification.",
            }
        else:
            # Update name if changed
            existing_user.name = req.name.strip()
            db.commit()
    else:
        new_user = User(
            name=req.name.strip(),
            phone=norm_phone,
            role="citizen",
            is_verified=False,
            created_at=datetime.utcnow(),
        )
        db.add(new_user)
        db.commit()

    success, msg = generate_and_store_otp(db, norm_phone)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    return {
        "success": True,
        "phone": norm_phone,
        "message": "Registration initiated. OTP sent to your mobile number.",
    }


@router.post("/citizen/login")
@router.post("/login")
def login_citizen(
    req: CitizenLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Direct login for citizens using mobile number (no OTP required).
    Checks if phone is registered; if not, returns 404 with guidance to register.
    """
    try:
        norm_phone = normalize_phone(req.phone)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user = db.query(User).filter(User.phone == norm_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number is not registered. Please create an account first.",
        )

    # Automatically ensure user is verified
    if not user.is_verified:
        user.is_verified = True
        db.commit()

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "name": user.name,
            "phone": user.phone,
        }
    )

    set_auth_cookie(response, token, request)

    return {
        "success": True,
        "user": UserResponse.from_orm(user),
        "token": token,
        "message": f"Welcome back, {user.name}.",
    }


@router.post("/otp/request")
def request_otp(
    req: OtpRequest,
    db: Session = Depends(get_db),
):
    """
    Requests a 6-digit OTP for citizen login.
    Checks if phone is registered; if not, returns 404 with guidance to register.
    """
    try:
        norm_phone = normalize_phone(req.phone)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user = db.query(User).filter(User.phone == norm_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mobile number is not registered. Please create an account first.",
        )

    success, msg = generate_and_store_otp(db, norm_phone)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    return {
        "success": True,
        "phone": norm_phone,
        "message": "OTP sent successfully to your mobile number.",
    }


@router.post("/otp/verify")
def verify_otp(
    req: OtpVerifyRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verifies 6-digit OTP code, sets secure HTTP-only session cookie,
    and returns session details.
    """
    try:
        norm_phone = normalize_phone(req.phone)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user = db.query(User).filter(User.phone == norm_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first.",
        )

    is_valid, msg = verify_stored_otp(db, norm_phone, req.code)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Mark user verified
    user.is_verified = True
    db.commit()

    # Issue JWT token
    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "name": user.name,
            "phone": user.phone,
        }
    )

    # Set session Cookie
    set_auth_cookie(response, token, request)

    return {
        "success": True,
        "user": UserResponse.from_orm(user),
        "token": token,
        "message": "Authentication successful.",
    }


@router.post("/department/login")
def department_login(
    req: DepartmentLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticates municipal department officers and commissioner using username & password.
    """
    raw_username = req.username.strip().lower()

    user = (
        db.query(User)
        .filter(
            func.lower(User.username) == raw_username,
            User.role.in_(["department", "commissioner"]),
        )
        .first()
    )

    # If user not found or password doesn't match, check against fallback demo accounts
    if (not user or not verify_password(req.password, user.password_hash or "")) and req.password == settings.DEMO_DEPT_PASSWORD:
        from app.db.init_db import DEFAULT_OFFICERS
        match_info = next((o for o in DEFAULT_OFFICERS if o["username"].lower() == raw_username), None)
        if match_info:
            hashed_pwd = hash_password(settings.DEMO_DEPT_PASSWORD)
            if not user:
                user = User(
                    name=match_info["name"],
                    username=match_info["username"].lower(),
                    role=match_info["role"],
                    department=match_info["department"],
                    password_hash=hashed_pwd,
                    is_verified=True,
                    created_at=datetime.utcnow(),
                )
                db.add(user)
            else:
                user.role = match_info["role"]
                user.department = match_info["department"]
                user.password_hash = hashed_pwd
                user.is_verified = True
            db.commit()
            db.refresh(user)

    if not user or not verify_password(req.password, user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid departmental username or password.",
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "name": user.name,
            "username": user.username,
            "department": user.department,
        }
    )

    set_auth_cookie(response, token, request)

    return {
        "success": True,
        "user": UserResponse.from_orm(user),
        "token": token,
        "message": f"Welcome, {user.name}.",
    }


@router.post("/logout")
def logout(response: Response, request: Request):
    """Logs out by clearing the session cookie."""
    clear_auth_cookie(response, request)
    return {"success": True, "message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the current authenticated user."""
    return UserResponse.from_orm(current_user)


@router.get("/me/tickets", response_model=CitizenTicketsResponse)
def get_my_tickets(
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    """
    Returns only the complaints submitted by the authenticated citizen.
    Includes master cluster status, progress, thumbnail, and category breakdown.
    """
    complaints = (
        db.query(Complaint)
        .filter(
            (Complaint.user_id == current_user.id)
            | ((Complaint.user_id == None) & (Complaint.citizen_name == current_user.name))
        )
        .order_by(Complaint.created_at.desc())
        .all()
    )

    ticket_items = []
    category_counts = Counter()

    for c in complaints:
        category_counts[c.category] += 1
        cluster = db.query(Cluster).filter(Cluster.id == c.cluster_id).first() if c.cluster_id else None

        ticket_items.append(
            CitizenTicketItem(
                ticket_id=c.id,
                category=c.category,
                severity=c.severity,
                raw_text=c.raw_text,
                image_url=c.image_url,
                latitude=c.latitude,
                longitude=c.longitude,
                status=cluster.status if cluster else "SUBMITTED",
                master_cluster_id=cluster.id if cluster else None,
                master_cluster_status=cluster.status if cluster else "SUBMITTED",
                assigned_dept=cluster.assigned_dept if cluster else "Pending Dispatch",
                sla_hours=cluster.sla_hours if cluster else 24,
                cluster_report_count=cluster.report_count if cluster else 1,
                created_at=c.created_at,
            )
        )

    return CitizenTicketsResponse(
        tickets=ticket_items,
        total_count=len(ticket_items),
        category_counts=dict(category_counts),
    )
