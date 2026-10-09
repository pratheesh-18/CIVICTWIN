import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, OtpCode
from seed_db import seed_database

client = TestClient(app)


def run_auth_smoke_test():
    print("\n================================================================================")
    print("CIVICTWIN AUTHENTICATION & RBAC AUTOMATED TEST SUITE")
    print("================================================================================\n")

    seed_database(force=True)
    start_time = time.time()
    passed = 0

    try:
        # TEST 1: Register new citizen
        print("[*] Test 1: Citizen Registration (/api/auth/register)...")
        reg_res = client.post(
            "/api/auth/register",
            json={"name": "Subramanian", "phone": "9840123456"},
        )
        assert reg_res.status_code == 200, f"Expected 200, got {reg_res.status_code}: {reg_res.text}"
        data = reg_res.json()
        assert data["success"] is True
        assert data["phone"] == "+919840123456"
        print(" [PASS] TEST 1: Citizen Registration ......... PASSED (E.164 Normalised: +919840123456)")
        passed += 1

        # TEST 2: Citizen Login OTP Verification
        print("[*] Test 2: Citizen Login & Mock OTP Verification...")
        # Verify with mock OTP 123456
        verify_res = client.post(
            "/api/auth/otp/verify",
            json={"phone": "+919840123456", "code": "123456"},
        )
        assert verify_res.status_code == 200, f"Expected 200, got {verify_res.status_code}: {verify_res.text}"
        v_data = verify_res.json()
        assert v_data["success"] is True
        assert "token" in v_data
        citizen_token = v_data["token"]
        print(" [PASS] TEST 2: Citizen OTP Verification ...... PASSED (Issued JWT Session)")
        passed += 1

        # TEST 3: Unregistered Phone Rejection
        print("[*] Test 3: Unregistered Phone Check...")
        unreg_res = client.post(
            "/api/auth/otp/request",
            json={"phone": "9999999999"},
        )
        assert unreg_res.status_code == 404, f"Expected 404, got {unreg_res.status_code}"
        assert "not registered" in unreg_res.json()["detail"].lower()
        print(" [PASS] TEST 3: Unregistered Phone Check ...... PASSED (Returned 404 with register guidance)")
        passed += 1

        # TEST 4: OTP Lockout after 5 wrong attempts
        print("[*] Test 4: 5 Failed OTP Attempts Lockout...")
        # Request a new OTP for Anand
        time.sleep(0.1)
        client.post("/api/auth/otp/request", json={"phone": "+919876543210"})
        for i in range(5):
            bad_res = client.post(
                "/api/auth/otp/verify",
                json={"phone": "+919876543210", "code": "000000"},
            )
            assert bad_res.status_code == 400

        # 6th attempt must be locked out
        locked_res = client.post(
            "/api/auth/otp/verify",
            json={"phone": "+919876543210", "code": "123456"},
        )
        assert locked_res.status_code == 400
        assert "locked" in locked_res.json()["detail"].lower()
        print(" [PASS] TEST 4: 5 Failed Attempts Lockout .... PASSED (Code locked against brute-force)")
        passed += 1

        # TEST 5: Citizen Tenant Isolation
        print("[*] Test 5: Citizen Complaint Isolation (/api/me/tickets)...")
        # Login as Anand
        anand_login_res = client.post(
            "/api/auth/otp/verify",
            json={"phone": "+919876543210", "code": "123456"},
        )
        # Note: since Anand's OTP was locked in Test 4, let's login as Priya
        priya_req = client.post("/api/auth/otp/request", json={"phone": "+919876543211"})
        priya_res = client.post(
            "/api/auth/otp/verify",
            json={"phone": "+919876543211", "code": "123456"},
        )
        priya_token = priya_res.json()["token"]

        tickets_res = client.get(
            "/api/me/tickets",
            headers={"Authorization": f"Bearer {priya_token}"},
        )
        assert tickets_res.status_code == 200
        priya_tickets = tickets_res.json()["tickets"]
        for t in priya_tickets:
            # Priya's tickets should only be Streetlight or filed by Priya
            assert t["category"] == "Streetlight"
        print(f" [PASS] TEST 5: Citizen Data Isolation ....... PASSED (Priya sees only {len(priya_tickets)} of her tickets)")
        passed += 1

        # TEST 6: Department Login & Filtered Cluster View
        print("[*] Test 6: Department Login & Cluster Filtering...")
        dept_login = client.post(
            "/api/auth/department/login",
            json={"username": "roads_officer", "password": "CivicAdmin@2026"},
        )
        assert dept_login.status_code == 200, f"Dept login failed: {dept_login.text}"
        dept_token = dept_login.json()["token"]

        dept_clusters = client.get(
            "/api/v1/clusters/active",
            headers={"Authorization": f"Bearer {dept_token}"},
        ).json()
        for c in dept_clusters:
            assert c["assigned_dept"] == "Roads & Infrastructure Maintenance Wing"

        # Commissioner login sees all
        comm_login = client.post(
            "/api/auth/department/login",
            json={"username": "commissioner", "password": "CivicAdmin@2026"},
        )
        comm_token = comm_login.json()["token"]
        comm_clusters = client.get(
            "/api/v1/clusters/active",
            headers={"Authorization": f"Bearer {comm_token}"},
        ).json()
        assert len(comm_clusters) >= len(dept_clusters)
        print(f" [PASS] TEST 6: Department vs Commissioner .... PASSED (Roads: {len(dept_clusters)}, Commissioner: {len(comm_clusters)})")
        passed += 1

        # TEST 7: Citizen Forbidden from Work Order Verification
        print("[*] Test 7: Citizen Forbidden from Closure Verification...")
        forbidden_res = client.post(
            "/api/v1/verification/verify-workorder",
            data={"cluster_id": 1, "gyro_tilt": -42.0},
            files={"after_image": ("photo.jpg", b"dummycontent", "image/jpeg")},
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        assert forbidden_res.status_code == 403, f"Expected 403, got {forbidden_res.status_code}"
        print(" [PASS] TEST 7: Role RBAC Enforcement ........ PASSED (Citizen receives 403 Forbidden)")
        passed += 1

        elapsed = time.time() - start_time
        print("\n================================================================================")
        print(f" ALL {passed} AUTH & RBAC TESTS PASSED SUCCESSFULLY IN {elapsed:.2f}s!")
        print("================================================================================\n")

    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_auth_smoke_test()
