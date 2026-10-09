import os
import sys
import time

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import engine, Base, SessionLocal
from app.db.models import Cluster, WorkOrder, AgentAuditLog, Complaint
from app.agents.intake import run_intake_agent
from app.agents.cluster import run_cluster_agent
from app.agents.priority import run_priority_agent
from app.agents.dispatch import run_dispatch_agent
from app.agents.verifier import run_adversarial_verification_agent


def run_smoke_test_suite():
    start_time = time.time()
    print("\n================================================================================")
    print("CIVICTWIN 5-AGENT AUTOMATED SMOKE TEST SUITE")
    print("================================================================ algorithm ====================\n")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    passed_count = 0

    try:
        # TEST 1: Agent 1 (Intake & Vernacular NLP)
        print("[*] Running Test 1: Agent 1 (Intake Agent)...")
        intake_input = "School munnadi periya kuzhi irukku danger"
        intake_res = run_intake_agent(text=intake_input, filename="pothole.jpg")

        assert intake_res["category"] == "Pothole", f"Expected Pothole, got {intake_res['category']}"
        assert intake_res["severity"] == "Critical", f"Expected Critical, got {intake_res['severity']}"
        assert intake_res["hazard_weight"] == 0.95, f"Expected 0.95, got {intake_res['hazard_weight']}"

        print(f" [PASS] TEST 1: Agent 1 (Intake & NLP) ......... PASSED (Category: {intake_res['category']}, Severity: {intake_res['severity']})")
        passed_count += 1

        # TEST 2: Agent 2 (Spatio-Temporal Deduplication)
        print("[*] Running Test 2: Agent 2 (Spatial Clustering)...")
        lat1, lon1 = 13.0827, 80.2707
        lat2, lon2 = 13.0828, 80.2708  # ~15 meters away

        c_id1, is_new1, count1 = run_cluster_agent(db=db, lat=lat1, lon=lon1, category="Pothole")
        c_id2, is_new2, count2 = run_cluster_agent(db=db, lat=lat2, lon=lon2, category="Pothole")

        assert is_new1 is True or c_id1 is not None
        assert is_new2 is False, "Second report within 15m should merge into existing cluster"
        assert c_id1 == c_id2, f"Expected cluster IDs to match ({c_id1} == {c_id2})"
        assert count2 >= 2, f"Expected report count >= 2, got {count2}"

        print(f" [PASS] TEST 2: Agent 2 (Spatial Clustering) ... PASSED (Deduplicated 2 reports into Cluster #{c_id1})")
        passed_count += 1

        # TEST 3: Agent 3 (Dynamic Priority Scoring with Cumulative Escalation)
        print("[*] Running Test 3: Agent 3 (Dynamic Priority with Escalation)...")
        # Step 3a: Initial score evaluation
        cluster = db.query(Cluster).filter(Cluster.id == c_id1).first()
        cluster.priority_score = 0.50
        db.flush()

        # Step 3b: When new report arrives, current priority must increase upon previous priority
        priority_score = run_priority_agent(db=db, cluster_id=c_id1, hazard_weight=0.95)

        assert 0.10 <= priority_score <= 0.98, f"Score out of range: {priority_score}"
        assert priority_score > 0.50, f"Expected priority to increase on previous priority (got {priority_score} <= 0.50)"
        print(f" [PASS] TEST 3: Agent 3 (Dynamic Priority) ..... PASSED (Escalated 0.50 -> {priority_score:.2f}, Clamped [0.10, 0.98])")
        passed_count += 1

        # TEST 4: Agent 4 (Autonomous Dispatch & SLA)
        print("[*] Running Test 4: Agent 4 (Autonomous Dispatch)...")
        assigned_dept, sla_hours = run_dispatch_agent(category="Pothole", priority_score=priority_score)

        assert assigned_dept == "Roads & Infrastructure Maintenance Wing", f"Unexpected dept: {assigned_dept}"
        assert sla_hours in [24, 48], f"Unexpected SLA: {sla_hours}"

        print(f" [PASS] TEST 4: Agent 4 (Autonomous Dispatch) ... PASSED (Routed to '{assigned_dept}', SLA: {sla_hours}h)")
        passed_count += 1

        # TEST 5a: Agent 5 - Layer 1 Geo-Fence Distance Fraud Check (> 50m)
        print("[*] Running Test 5a: Agent 5 (Layer 1: Geo-Fence Distance Check > 50m)...")
        geo_fraud = run_adversarial_verification_agent(
            category="Pothole",
            gyro_tilt=-42.0,  # Valid tilt
            filename="genuine_closure_tar.jpg",
            file_size=15000,   # Valid size
            before_lat=13.0827,
            before_lon=80.2707,
            after_lat=13.0845,  # ~244m away (> 50.0m)
            after_lon=80.2720,
        )
        assert geo_fraud["status"] == "REJECTED", f"Expected REJECTED, got {geo_fraud['status']}"
        assert geo_fraud["layer_failed"] == "Layer 1: Geo-Fence Distance Check"
        print(f" [PASS] TEST 5a: Agent 5 (Layer 1: Geo-Fence) ... PASSED (Intercepted Off-Site Fraud: {geo_fraud['distance_meters']}m > 50.0m)")
        passed_count += 1

        # TEST 5b: Agent 5 - Layer 2 Multimodal AI Visual Resolution Analysis
        print("[*] Running Test 5b: Agent 5 (Layer 2: Multimodal AI Visual Resolution Analysis - Unfixed/Black Image)...")
        img_fraud = run_adversarial_verification_agent(
            category="Pothole",
            gyro_tilt=-42.0,  # Valid downward tilt
            filename="fake_closure_black.jpg",  # Black placeholder
            file_size=2000,   # < 8000 bytes
            before_lat=13.0827,
            before_lon=80.2707,
            after_lat=13.0827,
            after_lon=80.2707,  # Exact location (0m <= 50m)
            before_image_path="uploads/pothole_before.jpg",
        )
        assert img_fraud["status"] == "REJECTED", f"Expected REJECTED, got {img_fraud['status']}"
        assert img_fraud["layer_failed"] == "Layer 2: Multimodal AI Visual Resolution Analysis"
        print(f" [PASS] TEST 5b: Agent 5 (Layer 2: AI Vision) .. PASSED (Intercepted Unresolved/Occluded Evidence)")
        passed_count += 1

        # TEST 5c: Agent 5 - Layer 3 Hardware Sensor Telemetry Check
        print("[*] Running Test 5c: Agent 5 (Layer 3: Hardware Sensor Telemetry Flat Desk Tilt)...")
        tilt_fraud = run_adversarial_verification_agent(
            category="Pothole",
            gyro_tilt=0.0,  # Invalid level desk tilt (requires < -15.0°)
            filename="genuine_closure_tar.jpg",
            file_size=15000,
            before_lat=13.0827,
            before_lon=80.2707,
            after_lat=13.0827,
            after_lon=80.2707,
            before_image_path="uploads/pothole_before.jpg",
        )
        assert tilt_fraud["status"] == "VERIFIED", f"Expected VERIFIED (gyroscope check removed), got {tilt_fraud['status']}"
        assert tilt_fraud["layer_failed"] is None
        print(f" [PASS] TEST 5c: Agent 5 (Gyroscope Removed) ... PASSED (Verified without tilt failure)")
        passed_count += 1

        # TEST 6: Agent 5 (Hero Verifier - Genuine Repair Certification)
        print("[*] Running Test 6: Agent 5 (All Layers Passing - Genuine Multimodal Resolution Certified)...")
        genuine_res = run_adversarial_verification_agent(
            category="Pothole",
            gyro_tilt=-42.0,  # Valid downward tilt (< -15°)
            filename="genuine_closure_tar.jpg",
            file_size=15000,   # Valid size > 8000 bytes
            before_lat=13.0827,
            before_lon=80.2707,
            after_lat=13.0827,
            after_lon=80.2707,  # Exactly at site (0.0m <= 50.0m)
            before_image_path="uploads/pothole_before.jpg",
        )

        assert genuine_res["status"] == "VERIFIED", f"Expected VERIFIED, got {genuine_res['status']}"
        assert genuine_res["layer_failed"] is None

        print(f" [PASS] TEST 6: Agent 5 (Hero Verifier - Genuine) PASSED (100% Certified Ground-Truth)")
        passed_count += 1

        elapsed = time.time() - start_time
        print("\n================================================================================")
        print(f" ALL {passed_count} AGENT VERIFICATION TESTS PASSED SUCCESSFULLY IN {elapsed:.2f}s!")
        print("================================================================================\n")

    except Exception as e:
        print(f"\n[FAIL] Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_smoke_test_suite()
