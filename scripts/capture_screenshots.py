"""
Capture screenshots of the Campus Laundry Slot Booking and Billing System using Playwright and MS Edge
"""
import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def capture():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(root_dir, "frontend")
    img_dir = os.path.join(root_dir, "docs", "images")
    os.makedirs(img_dir, exist_ok=True)

    print("Starting backend...")
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8000", "--host", "127.0.0.1"],
        cwd=root_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    print("Starting frontend (vite preview)...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend = subprocess.Popen(
        [npm_cmd, "run", "preview", "--", "--port", "5173"],
        cwd=frontend_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    time.sleep(3)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    try:
        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(executable_path=edge_path, headless=True)
            context = browser.new_context(viewport={"width": 1366, "height": 850})
            page = context.new_page()

            # 1. Login View
            print("Capturing Login View...")
            page.goto("http://localhost:5173", wait_until="networkidle")
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(img_dir, "screen_01_login.png"))

            # Fill student credentials
            print("Logging in as student Aditya Sharma...")
            page.fill("input[type='email']", "aditya.cs24@campus.edu")
            page.fill("input[type='password']", "student123")
            page.click("button[type='submit']")
            page.wait_for_timeout(1500)

            # 2. Student Dashboard with Live Stepper
            print("Capturing Student Order Portal...")
            page.screenshot(path=os.path.join(img_dir, "screen_02_student_portal.png"))

            # 3. View Receipt Modal
            print("Capturing Receipt Modal...")
            receipt_btn = page.query_selector("button:has-text('View Official Receipt')")
            if receipt_btn:
                receipt_btn.click()
                page.wait_for_timeout(800)
                page.screenshot(path=os.path.join(img_dir, "screen_03_receipt_modal.png"))
                # Close modal
                close_btn = page.query_selector("button:has-text('Close')")
                if close_btn:
                    close_btn.click()
                page.wait_for_timeout(500)

            # 4. Services View
            print("Capturing Services Catalog...")
            services_tab = page.query_selector("button:has-text('Services')")
            if services_tab:
                services_tab.click()
                page.wait_for_timeout(800)
                page.screenshot(path=os.path.join(img_dir, "screen_04_services.png"))

            # 5. Slots View
            print("Capturing Slots Scheduling...")
            slots_tab = page.query_selector("button:has-text('Slots')")
            if slots_tab:
                slots_tab.click()
                page.wait_for_timeout(800)
                page.screenshot(path=os.path.join(img_dir, "screen_05_slots.png"))

            # 6. DBMS Spec View
            print("Capturing DBMS Specification...")
            dbms_tab = page.query_selector("button:has-text('DBMS Spec')")
            if dbms_tab:
                dbms_tab.click()
                page.wait_for_timeout(800)
                page.screenshot(path=os.path.join(img_dir, "screen_06_dbms_spec.png"))

            # Sign Out
            print("Signing out...")
            signout_btn = page.query_selector("button:has-text('Sign Out')")
            if signout_btn:
                signout_btn.click()
                page.wait_for_timeout(1000)

            # Log in as Admin
            print("Logging in as Administrator...")
            admin_tab = page.query_selector("button:has-text('Staff Administrator')")
            if admin_tab:
                admin_tab.click()
                page.wait_for_timeout(600)
            
            # Click demo admin card or fill inputs
            demo_admin = page.query_selector(".demo-admin-card")
            if demo_admin:
                demo_admin.click()
                page.wait_for_timeout(500)
            else:
                page.fill("input[placeholder*='admin']", "admin")
                page.fill("input[type='password']", "admin123")
                
            page.click("button[type='submit']")
            page.wait_for_timeout(1500)

            # 7. Admin Order Console
            print("Capturing Admin Order Console...")
            page.screenshot(path=os.path.join(img_dir, "screen_07_admin_console.png"))

            # 8. Reports & Analytics
            print("Capturing Reports & Analytics...")
            reports_tab = page.query_selector("button:has-text('Reports')")
            if reports_tab:
                reports_tab.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(img_dir, "screen_08_reports.png"))

            # 9. Students Management
            print("Capturing Students Management...")
            students_tab = page.query_selector("button:has-text('Students')")
            if students_tab:
                students_tab.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(img_dir, "screen_09_students.png"))

            # Sign out again to capture registration modal
            print("Capturing Registration Screen...")
            signout_btn = page.query_selector("button:has-text('Sign Out')")
            if signout_btn:
                signout_btn.click()
                page.wait_for_timeout(800)
            
            reg_pill = page.query_selector("button:has-text('New Student Registration')")
            if reg_pill:
                reg_pill.click()
                page.wait_for_timeout(600)
                page.screenshot(path=os.path.join(img_dir, "screen_10_registration.png"))

            browser.close()
            print("All screenshots successfully captured!")
    finally:
        print("Stopping servers...")
        frontend.terminate()
        backend.terminate()

if __name__ == "__main__":
    capture()
