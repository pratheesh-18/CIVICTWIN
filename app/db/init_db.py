import os
import json
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import User, Cluster, Complaint, WorkOrder, AgentAuditLog


DEFAULT_OFFICERS = [
    {
        "username": "admin",
        "name": "System Administrator",
        "role": "commissioner",
        "department": None,
    },
    {
        "username": "commissioner",
        "name": "Commissioner Radhakrishnan IAS",
        "role": "commissioner",
        "department": None,
    },
    {
        "username": "roads_officer",
        "name": "Officer Ramanathan",
        "role": "department",
        "department": "Roads & Infrastructure Maintenance Wing",
    },
    {
        "username": "water_officer",
        "name": "Officer Meenakshi",
        "role": "department",
        "department": "TWAD / Metro Water Supply Board",
    },
    {
        "username": "electrical_officer",
        "name": "Officer Senthil",
        "role": "department",
        "department": "Municipal Electrical & Lighting Dept",
    },
    {
        "username": "sanitation_officer",
        "name": "Officer Gayathri",
        "role": "department",
        "department": "Solid Waste Management Division",
    },
]


def init_default_data(db: Session) -> None:
    """
    Idempotently ensures default administrative and departmental accounts exist
    with valid hashed passwords, and seeds baseline clusters if the database is empty.
    """
    try:
        dept_password = os.getenv("DEMO_DEPT_PASSWORD", settings.DEMO_DEPT_PASSWORD)
        hashed_pwd = hash_password(dept_password)

        # 1. Ensure Default Department and Admin Users
        for info in DEFAULT_OFFICERS:
            user = (
                db.query(User)
                .filter(func.lower(User.username) == info["username"].lower())
                .first()
            )
            if not user:
                user = User(
                    name=info["name"],
                    username=info["username"].lower(),
                    role=info["role"],
                    department=info["department"],
                    password_hash=hashed_pwd,
                    is_verified=True,
                    created_at=datetime.utcnow(),
                )
                db.add(user)
            else:
                user.role = info["role"]
                user.department = info["department"]
                user.password_hash = hashed_pwd
                user.is_verified = True

        # 2. Ensure Baseline Citizens
        citizens_data = [
            {"name": "Anand", "phone": "+919876543210"},
            {"name": "Priya", "phone": "+919876543211"},
            {"name": "Karthik", "phone": "+919876543212"},
        ]
        created_citizens = []
        for cdata in citizens_data:
            cit = db.query(User).filter(User.phone == cdata["phone"]).first()
            if not cit:
                cit = User(
                    name=cdata["name"],
                    phone=cdata["phone"],
                    role="citizen",
                    is_verified=True,
                    created_at=datetime.utcnow(),
                )
                db.add(cit)
            created_citizens.append(cit)

        db.flush()

        # 3. Seed demo clusters if no clusters exist
        cluster_count = db.query(Cluster).count()
        if cluster_count == 0:
            c1 = Cluster(
                title="Deep Waterlogged Crater near Anna Nagar Higher Secondary School",
                category="Pothole",
                latitude=13.0827,
                longitude=80.2707,
                report_count=14,
                priority_score=0.94,
                status="OPEN",
                assigned_dept="Roads & Infrastructure Maintenance Wing",
                sla_hours=24,
                created_at=datetime.utcnow(),
            )
            db.add(c1)
            db.flush()

            wo1 = WorkOrder(
                cluster_id=c1.id,
                assigned_contractor="City Infrastructure Contractors Ltd",
                contractor_trust_score=100.0,
                before_image="/uploads/pothole_before.jpg",
                before_latitude=c1.latitude,
                before_longitude=c1.longitude,
                verification_status="PENDING",
                created_at=datetime.utcnow(),
            )
            db.add(wo1)

            complaint1 = Complaint(
                citizen_name="Anand",
                user_id=created_citizens[0].id if created_citizens else None,
                raw_text="Anna Nagar 4th street school munnadi periya kuzhi irukku. Mazhai thanni thengi pillaiyalaam vizhudhu, romba danger.",
                image_url="/uploads/pothole_before.jpg",
                latitude=13.0827,
                longitude=80.2707,
                category="Pothole",
                severity="Critical",
                cluster_id=c1.id,
                created_at=datetime.utcnow(),
            )
            db.add(complaint1)

            c2 = Cluster(
                title="Main Drinking Water Pipeline Joint Burst near T. Nagar Market",
                category="Water Leakage",
                latitude=13.0418,
                longitude=80.2341,
                report_count=8,
                priority_score=0.86,
                status="OPEN",
                assigned_dept="TWAD / Metro Water Supply Board",
                sla_hours=48,
                created_at=datetime.utcnow(),
            )
            db.add(c2)
            db.flush()

            wo2 = WorkOrder(
                cluster_id=c2.id,
                assigned_contractor="Metro Water Pipelines Co.",
                contractor_trust_score=100.0,
                before_image="/uploads/water_leak_before.jpg",
                before_latitude=c2.latitude,
                before_longitude=c2.longitude,
                verification_status="PENDING",
                created_at=datetime.utcnow(),
            )
            db.add(wo2)

            complaint2 = Complaint(
                citizen_name="Anand",
                user_id=created_citizens[0].id if created_citizens else None,
                raw_text="T. Nagar market kitta main drinking pipe vedichu romba thanni waste aagudhu.",
                image_url="/uploads/water_leak_before.jpg",
                latitude=13.0418,
                longitude=80.2341,
                category="Water Leakage",
                severity="High",
                cluster_id=c2.id,
                created_at=datetime.utcnow(),
            )
            db.add(complaint2)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[CivicTwin Init Error] Could not initialize baseline defaults: {e}")
