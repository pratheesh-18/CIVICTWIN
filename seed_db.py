import os
import json
from datetime import datetime
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import engine, Base, SessionLocal
from app.db.models import Complaint, Cluster, WorkOrder, AgentAuditLog, User, OtpCode


def seed_database(force: bool = True):
    """
    Seeds the SQLite database with users, realistic Chennai municipal clusters,
    work orders, and agent audit trails.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    dept_password = os.getenv("DEMO_DEPT_PASSWORD", settings.DEMO_DEPT_PASSWORD)
    hashed_dept_pwd = hash_password(dept_password)

    try:
        if force:
            print("[CIVICTWIN SEEDER] Dropping and recreating all tables for fresh seed...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        print("[CIVICTWIN SEEDER] Seeding demo users (3 citizens, 4 department officers, 1 commissioner)...")

        # 3 Demo Citizens
        citizen1 = User(
            name="Anand",
            phone="+919876543210",
            role="citizen",
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        citizen2 = User(
            name="Priya",
            phone="+919876543211",
            role="citizen",
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        citizen3 = User(
            name="Karthik",
            phone="+919876543212",
            role="citizen",
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        db.add_all([citizen1, citizen2, citizen3])
        db.flush()

        # 4 Department Officers + 1 Commissioner
        dept_roads = User(
            name="Officer Ramanathan",
            username="roads_officer",
            role="department",
            department="Roads & Infrastructure Maintenance Wing",
            password_hash=hashed_dept_pwd,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        dept_water = User(
            name="Officer Meenakshi",
            username="water_officer",
            role="department",
            department="TWAD / Metro Water Supply Board",
            password_hash=hashed_dept_pwd,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        dept_electrical = User(
            name="Officer Senthil",
            username="electrical_officer",
            role="department",
            department="Municipal Electrical & Lighting Dept",
            password_hash=hashed_dept_pwd,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        dept_sanitation = User(
            name="Officer Gayathri",
            username="sanitation_officer",
            role="department",
            department="Solid Waste Management Division",
            password_hash=hashed_dept_pwd,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        commissioner = User(
            name="Commissioner Radhakrishnan IAS",
            username="commissioner",
            role="commissioner",
            department=None,
            password_hash=hashed_dept_pwd,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        db.add_all([dept_roads, dept_water, dept_electrical, dept_sanitation, commissioner])
        db.flush()

        print("[CIVICTWIN SEEDER] Seeding database with 4 realistic demo clusters...")

        # Cluster #1: Pothole in Anna Nagar
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
            user_id=citizen1.id,
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

        audit_logs_c1 = [
            AgentAuditLog(
                cluster_id=c1.id,
                agent_name="Agent 1 - Intake Agent",
                input_data=json.dumps({"text": complaint1.raw_text, "filename": "pothole_before.jpg"}),
                decision_output=json.dumps({"category": "Pothole", "severity": "Critical", "hazard_weight": 0.95}),
                confidence_score=0.96,
            ),
            AgentAuditLog(
                cluster_id=c1.id,
                agent_name="Agent 2 - Spatial Clustering Agent",
                input_data=json.dumps({"lat": 13.0827, "lon": 80.2707, "category": "Pothole"}),
                decision_output=json.dumps({"cluster_id": c1.id, "is_new_cluster": False, "report_count": 14}),
                confidence_score=0.98,
            ),
            AgentAuditLog(
                cluster_id=c1.id,
                agent_name="Agent 3 - Priority Scoring Agent",
                input_data=json.dumps({"cluster_id": c1.id, "hazard_weight": 0.95, "report_count": 14}),
                decision_output=json.dumps({"priority_score": 0.94}),
                confidence_score=0.95,
            ),
            AgentAuditLog(
                cluster_id=c1.id,
                agent_name="Agent 4 - Department Dispatch Agent",
                input_data=json.dumps({"category": "Pothole", "priority_score": 0.94}),
                decision_output=json.dumps({"assigned_dept": "Roads & Infrastructure Maintenance Wing", "sla_hours": 24}),
                confidence_score=0.99,
            ),
        ]
        for log in audit_logs_c1:
            db.add(log)

        # Cluster #2: Water Leakage in T. Nagar
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
            user_id=citizen1.id,
            raw_text="T. Nagar market kitta main drinking pipe vedichu romba thanni waste aagudhu, road muzhuka kulam maathiri thengi kedakku.",
            image_url="/uploads/water_leak_before.jpg",
            latitude=13.0418,
            longitude=80.2341,
            category="Water Leakage",
            severity="High",
            cluster_id=c2.id,
            created_at=datetime.utcnow(),
        )
        db.add(complaint2)

        # Cluster #3: Streetlight Hazard in Mylapore
        c3 = Cluster(
            title="Exposed High Voltage Streetlight Wiring near Mylapore Temple Tank",
            category="Streetlight",
            latitude=13.0339,
            longitude=80.2678,
            report_count=3,
            priority_score=0.62,
            status="OPEN",
            assigned_dept="Municipal Electrical & Lighting Dept",
            sla_hours=48,
            created_at=datetime.utcnow(),
        )
        db.add(c3)
        db.flush()

        wo3 = WorkOrder(
            cluster_id=c3.id,
            assigned_contractor="Electrical Maintenance Wing",
            contractor_trust_score=100.0,
            before_image="/uploads/streetlight_broken.jpg",
            before_latitude=c3.latitude,
            before_longitude=c3.longitude,
            verification_status="PENDING",
            created_at=datetime.utcnow(),
        )
        db.add(wo3)

        complaint3 = Complaint(
            citizen_name="Priya",
            user_id=citizen2.id,
            raw_text="Mylapore temple kitta streetlight kambathula wire thongudhu, shock adikkum mathiri irukku, eriyavum illa.",
            image_url="/uploads/streetlight_broken.jpg",
            latitude=13.0339,
            longitude=80.2678,
            category="Streetlight",
            severity="High",
            cluster_id=c3.id,
            created_at=datetime.utcnow(),
        )
        db.add(complaint3)

        # Cluster #4: Garbage in Adyar
        c4 = Cluster(
            title="Illegal Garbage Dumping on Pavement near School Junction",
            category="Garbage",
            latitude=13.0102,
            longitude=80.2157,
            report_count=6,
            priority_score=0.72,
            status="VERIFIED",
            assigned_dept="Solid Waste Management Division",
            sla_hours=48,
            created_at=datetime.utcnow(),
        )
        db.add(c4)
        db.flush()

        wo4 = WorkOrder(
            cluster_id=c4.id,
            assigned_contractor="Clean City Sanitation Ltd",
            contractor_trust_score=100.0,
            before_image="/uploads/genuine_closure_tar.jpg",
            after_image="/uploads/genuine_closure_tar.jpg",
            before_latitude=c4.latitude,
            before_longitude=c4.longitude,
            after_latitude=c4.latitude,
            after_longitude=c4.longitude,
            gyro_tilt=-42.0,
            verification_status="VERIFIED",
            created_at=datetime.utcnow(),
        )
        db.add(wo4)

        complaint4 = Complaint(
            citizen_name="Anand",
            user_id=citizen1.id,
            raw_text="Kuppai thotti nirambi road muzhuka paravi naathham adikkudhu.",
            image_url="/uploads/genuine_closure_tar.jpg",
            latitude=13.0102,
            longitude=80.2157,
            category="Garbage",
            severity="Medium",
            cluster_id=c4.id,
            created_at=datetime.utcnow(),
        )
        db.add(complaint4)

        db.commit()
        print("[CIVICTWIN SEEDER] Database successfully seeded with 3 citizens, 5 officers, 4 clusters, and tickets!")

    except Exception as e:
        db.rollback()
        print(f"[CIVICTWIN SEEDER ERROR] Failed to seed database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database(force=True)
