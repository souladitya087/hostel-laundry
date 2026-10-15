"""
End-to-End Verification Test Script
Tests all requirements from the task specification:
1. Student login with college email and password
2. Student registration with college email and password
3. Distinct admin login with username/email and password
4. Demo users endpoint
5. Orders query with items by pair/piece
6. Status updates
7. Dual database (MySQL & SQLite) functionality
"""

import sys
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import execute_query, test_database_connection, get_db

client = TestClient(app)

class TestAuthAndPortalE2E(unittest.TestCase):

    def test_01_db_connection(self):
        status = test_database_connection()
        print("\n[TEST 1] Active DB connection:", status)
        self.assertIn(status["status"], ["connected"])

    def test_02_demo_users_endpoint(self):
        print("\n[TEST 2] Testing /api/auth/demo-users...")
        res = client.get("/api/auth/demo-users")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("admin", data)
        self.assertIn("sample_students", data)
        self.assertEqual(data["admin"]["username"], "admin")
        self.assertEqual(data["admin"]["password"], "admin123")
        self.assertTrue(len(data["sample_students"]) > 0)
        first_student = data["sample_students"][0]
        self.assertIn("@", first_student["email"])
        self.assertEqual(first_student["password"], "student123")
        print("Demo users successfully verified with college emails & passwords.")

    def test_03_student_email_login_success(self):
        print("\n[TEST 3] Testing student login with college email and password...")
        payload = {
            "role": "student",
            "email": "aditya.cs24@campus.edu",
            "password": "student123"
        }
        res = client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["role"], "student")
        self.assertEqual(data["user"]["email"], "aditya.cs24@campus.edu")
        self.assertNotIn("password", data["user"])
        print(f"Logged in successfully: {data['user']['name']} ({data['user']['email']})")

    def test_04_student_email_login_invalid_password(self):
        print("\n[TEST 4] Testing student login with incorrect password...")
        payload = {
            "role": "student",
            "email": "aditya.cs24@campus.edu",
            "password": "wrong_password_999"
        }
        res = client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect password", res.json()["detail"])
        print("Incorrect password correctly rejected with 401.")

    def test_05_student_email_login_nonexistent(self):
        print("\n[TEST 5] Testing student login with nonexistent college email...")
        payload = {
            "role": "student",
            "email": "ghost.user@campus.edu",
            "password": "student123"
        }
        res = client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 404)
        print("Nonexistent email correctly rejected with 404.")

    def test_06_student_registration_and_login(self):
        print("\n[TEST 6] Testing student registration with college email and password...")
        reg_payload = {
            "name": "Kavita Singhania",
            "register_no": "2024CS999",
            "phone": "+91 91234 56789",
            "email": "kavita.cs24@campus.edu",
            "password": "mySecurePass123",
            "room_no": "GH-405"
        }
        # Clean up if existed from previous run
        execute_query("DELETE FROM students WHERE register_no = ? OR email = ?;", (reg_payload["register_no"], reg_payload["email"]), fetch="none")

        res = client.post("/api/auth/register-student", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["user"]["email"], "kavita.cs24@campus.edu")
        new_student_id = data["user"]["student_id"]

        # Now test logging in with the newly registered student's college email & password
        login_res = client.post("/api/auth/login", json={
            "role": "student",
            "email": "kavita.cs24@campus.edu",
            "password": "mySecurePass123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.json()["user"]["name"], "Kavita Singhania")
        print("Registration and subsequent login verified cleanly.")

        # Clean up
        execute_query("DELETE FROM students WHERE student_id = ?;", (new_student_id,), fetch="none")

    def test_07_admin_login(self):
        print("\n[TEST 7] Testing administrator login...")
        # 1. By username
        res = client.post("/api/auth/login", json={
            "role": "admin",
            "username": "admin",
            "password": "admin123"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "admin")

        # 2. By email
        res_email = client.post("/api/auth/login", json={
            "role": "admin",
            "email": "admin@campus.edu",
            "password": "admin123"
        })
        self.assertEqual(res_email.status_code, 200)
        self.assertEqual(res_email.json()["role"], "admin")

        # 3. Wrong password
        res_wrong = client.post("/api/auth/login", json={
            "role": "admin",
            "username": "admin",
            "password": "badpassword"
        })
        self.assertEqual(res_wrong.status_code, 401)
        print("Admin login with username, email, and password rejection verified.")

    def test_08_student_orders_and_pair_items(self):
        print("\n[TEST 8] Testing student orders query and laundry items (by pair / pieces)...")
        res = client.get("/api/bookings?student_id=1")
        self.assertEqual(res.status_code, 200)
        bookings = res.json()
        self.assertTrue(len(bookings) > 0)
        b = bookings[0]
        self.assertIn("pickup_code", b)
        self.assertIn("booking_status", b)
        self.assertIn("total_amount", b)
        self.assertIn("items", b)
        print(f"Booking {b['pickup_code']} items count: {len(b['items'])}")
        for it in b["items"]:
            self.assertIn("service_name", it)
            self.assertIn("quantity", it)
            self.assertIn("unit_type", it)
            self.assertIn("line_total", it)
            print(f"  - {it['service_name']}: {it['quantity']} {it['unit_type']}s @ Rs.{it['unit_price']} = Rs.{it['line_total']}")
        self.assertTrue(any(it.get("unit_type") in ("pair", "piece") for it in b["items"]))

    def test_09_admin_view_all_orders_and_status_update(self):
        print("\n[TEST 9] Testing admin view orders from all users and status update...")
        res = client.get("/api/bookings")
        self.assertEqual(res.status_code, 200)
        all_bookings = res.json()
        self.assertTrue(len(all_bookings) >= 4)
        target_booking = all_bookings[0]
        b_id = target_booking["booking_id"]
        original_status = target_booking["booking_status"]

        # Update status to 'Ready for Pickup'
        patch_res = client.patch(f"/api/bookings/{b_id}/status", json={"status": "Ready for Pickup"})
        self.assertEqual(patch_res.status_code, 200)

        # Verify update
        check_res = client.get(f"/api/bookings/{b_id}")
        self.assertEqual(check_res.json()["booking_status"], "Ready for Pickup")

        # Revert back to original
        client.patch(f"/api/bookings/{b_id}/status", json={"status": original_status})
        print(f"Admin order status management verified for order #{b_id}")

    def test_10_receipt_endpoint(self):
        print("\n[TEST 10] Testing booking receipt endpoint...")
        res = client.get("/api/bookings/1")
        self.assertEqual(res.status_code, 200)
        receipt = res.json()
        self.assertIn("pickup_code", receipt)
        self.assertIn("student_name", receipt)
        self.assertIn("items", receipt)
        self.assertIn("total_amount", receipt)
        print(f"Receipt for token {receipt['pickup_code']}: Total Rs.{receipt['total_amount']}")

    def test_11_student_registration_validation(self):
        print("\n[TEST 11] Testing student registration input sanity validations...")
        # Whitespace name
        res = client.post("/api/auth/register-student", json={
            "name": "   ", "register_no": "2024REGX1", "phone": "9876543210",
            "email": "valid1@campus.edu", "password": "pass", "room_no": "BH-101"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Full name is required", res.json()["detail"])

        # Whitespace phone
        res = client.post("/api/auth/register-student", json={
            "name": "Valid Name", "register_no": "2024REGX2", "phone": "   ",
            "email": "valid2@campus.edu", "password": "pass", "room_no": "BH-101"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("phone number is required", res.json()["detail"].lower())

        # Whitespace room_no
        res = client.post("/api/auth/register-student", json={
            "name": "Valid Name", "register_no": "2024REGX3", "phone": "9876543210",
            "email": "valid3@campus.edu", "password": "pass", "room_no": "   "
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("room number is required", res.json()["detail"].lower())

        # Invalid email format (missing @ or .)
        res = client.post("/api/auth/register-student", json={
            "name": "Valid Name", "register_no": "2024REGX4", "phone": "9876543210",
            "email": "invalidemailformat", "password": "pass", "room_no": "BH-101"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("college email", res.json()["detail"].lower())

        # Short password (< 4 chars)
        res = client.post("/api/auth/register-student", json={
            "name": "Valid Name", "register_no": "2024REGX5", "phone": "9876543210",
            "email": "valid5@campus.edu", "password": "123", "room_no": "BH-101"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 4 characters", res.json()["detail"])
        print("Student registration validation edge cases correctly enforced with 400.")

    def test_12_student_update_email_collision(self):
        print("\n[TEST 12] Testing student update email duplicate conflict protection...")
        # Student 1 trying to update email to Student 2's email
        res = client.put("/api/students/1", json={"email": "priya.it24@campus.edu"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["detail"])
        print("Duplicate email update cleanly rejected with HTTP 400 (no 500 crash).")

    def test_13_completed_and_cancelled_order_queries(self):
        print("\n[TEST 13] Testing completed and cancelled order status handling...")
        # Sneha Kulkarni has Completed order
        res = client.get("/api/bookings?student_id=4")
        self.assertEqual(res.status_code, 200)
        sneha_orders = res.json()
        self.assertTrue(len(sneha_orders) > 0)
        sneha_b = sneha_orders[0]
        self.assertIn("status", sneha_b)
        self.assertIn("booking_status", sneha_b)
        self.assertEqual(sneha_b["booking_status"], "Completed")
        self.assertIn("student_email", sneha_b)
        self.assertEqual(sneha_b["student_email"], "sneha.ec24@campus.edu")
        self.assertTrue(len(sneha_b["items"]) > 0)
        print(f"Completed order verified: {sneha_b['pickup_code']} - {sneha_b['items'][0]['service_name']} ({sneha_b['booking_status']})")

if __name__ == "__main__":
    unittest.main()
