import os
import sys
import time
from fastapi.testclient import TestClient
from sqlalchemy import func

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.models import Cluster
from app.core.definitions import (
    DEPARTMENT_MAP,
    is_status_solved,
    is_status_pending,
    get_ist_today_bounds,
)
from seed_db import seed_database

client = TestClient(app)


def run_department_dashboard_tests():
    print("\n================================================================================")
    print("CIVICTWIN DEPARTMENT DASHBOARDS & STATS VERIFICATION SUITE")
    print("================================================================================\n")

    seed_database(force=True)
    db = SessionLocal()
    start_time = time.time()
    passed = 0

    try:
        # TEST 1: Direct SQL counts vs API stats for all 4 departments
        print("[*] Test 1: Verifying SQL direct counts match API Department Stats...")

        # Login as Commissioner
        comm_login = client.post(
            "/api/auth/department/login",
            json={"username": "commissioner", "password": "CivicAdmin@2026"},
        )
        assert comm_login.status_code == 200, f"Comm login failed: {comm_login.text}"
        comm_token = comm_login.json()["token"]
        headers = {"Authorization": f"Bearer {comm_token}"}

        today_start, today_end = get_ist_today_bounds()

        for slug, dinfo in DEPARTMENT_MAP.items():
            dept_name = dinfo["name"]

            # Direct SQL counts
            dept_clusters = db.query(Cluster).filter(Cluster.assigned_dept == dept_name).all()
            sql_overall = len(dept_clusters)
            sql_solved = sum(1 for c in dept_clusters if is_status_solved(c.status))
            sql_pending = sum(1 for c in dept_clusters if is_status_pending(c.status))
            sql_today = sum(1 for c in dept_clusters if c.created_at and today_start <= c.created_at <= today_end)
            sql_reports = sum(c.report_count for c in dept_clusters)

            # API Call
            api_res = client.get(f"/api/stats/department/{slug}", headers=headers)
            assert api_res.status_code == 200, f"API failed for {slug}: {api_res.text}"
            data = api_res.json()

            assert data["overall_registered"] == sql_overall, f"Overall mismatch for {slug}: {data['overall_registered']} != {sql_overall}"
            assert data["total_solved"] == sql_solved, f"Solved mismatch for {slug}: {data['total_solved']} != {sql_solved}"
            assert data["pending"] == sql_pending, f"Pending mismatch for {slug}: {data['pending']} != {sql_pending}"
            assert data["today_received"] == sql_today, f"Today mismatch for {slug}: {data['today_received']} != {sql_today}"
            assert data["total_reports"] == sql_reports, f"Reports mismatch for {slug}: {data['total_reports']} != {sql_reports}"

            print(f" [PASS] {dinfo['slug'].upper()}: SQL direct counts match API (Overall: {sql_overall}, Solved: {sql_solved}, Pending: {sql_pending}, Today: {sql_today})")

        passed += 1

        # TEST 2: City-Wide Overview Stats Endpoint
        print("\n[*] Test 2: Testing /api/stats/overview for Commissioner...")
        overview_res = client.get("/api/stats/overview", headers=headers)
        assert overview_res.status_code == 200
        ov_data = overview_res.json()
        assert len(ov_data["departments"]) == 4
        assert ov_data["city_totals"]["overall_registered"] == 4
        print(f" [PASS] City-Wide Overview Verified (4 Departments, City Total: {ov_data['city_totals']['overall_registered']} problems, {ov_data['city_totals']['total_reports']} reports)")
        passed += 1

        # TEST 3: Strict Priority Ordering
        print("\n[*] Test 3: Verifying Strict Priority Ordering (Tier 1 > Tier 2 > Tier 3)...")
        roads_problems = client.get("/api/department/roads/problems", headers=headers).json()
        assert "problems" in roads_problems
        problems = roads_problems["problems"]
        assert len(problems) > 0

        # Check ranking order
        prev_tier = 0
        prev_score = 999.0
        for p in problems:
            assert p["tier_number"] >= prev_tier, f"Tier order violation: {p['tier_number']} < {prev_tier}"
            if p["tier_number"] == prev_tier:
                assert p["priority_score"] <= prev_score + 0.001, f"Score order violation: {p['priority_score']} > {prev_score}"
            prev_tier = p["tier_number"]
            prev_score = p["priority_score"]

        print(f" [PASS] Priority Order Verified: Ranked #1 has Tier {problems[0]['tier_number']} with Priority Score {problems[0]['priority_score']}")
        passed += 1

        # TEST 4: Department RBAC Isolation
        print("\n[*] Test 4: Testing Department RBAC Security Isolation...")
        # Login as Roads Officer
        roads_login = client.post(
            "/api/auth/department/login",
            json={"username": "roads_officer", "password": "CivicAdmin@2026"},
        )
        assert roads_login.status_code == 200
        roads_token = roads_login.json()["token"]
        roads_headers = {"Authorization": f"Bearer {roads_token}"}

        # Roads officer can access roads
        r_ok = client.get("/api/stats/department/roads", headers=roads_headers)
        assert r_ok.status_code == 200

        # Roads officer CANNOT access water (Must return 403)
        r_forbidden = client.get("/api/stats/department/water", headers=roads_headers)
        assert r_forbidden.status_code == 403, f"Expected 403 Forbidden for cross-dept access, got {r_forbidden.status_code}"

        # Roads officer CANNOT access city-wide overview (Must return 403)
        r_comm_forbidden = client.get("/api/stats/overview", headers=roads_headers)
        assert r_comm_forbidden.status_code == 403

        print(" [PASS] Department Security Isolation Verified: Cross-department access strictly returns 403 Forbidden")
        passed += 1

        elapsed = time.time() - start_time
        print("\n================================================================================")
        print(f" ALL {passed} DEPARTMENT DASHBOARD & STATS TESTS PASSED IN {elapsed:.2f}s!")
        print("================================================================================\n")

    except Exception as e:
        print(f"\n[FAIL] Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_department_dashboard_tests()
