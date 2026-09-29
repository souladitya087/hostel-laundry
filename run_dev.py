"""
Convenience launcher to run both FastAPI backend and Vite frontend simultaneously.
Usage: python run_dev.py
"""
import subprocess
import sys
import os
import time

def run():
    print("=" * 60)
    print("🚀 Starting Campus Laundry Slot Booking & Billing System")
    print("=" * 60)
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    # Start FastAPI Backend
    print("[1/2] 🔌 Launching FastAPI Backend on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000", "--host", "127.0.0.1"],
        cwd=root_dir
    )

    time.sleep(1.5)

    # Start Vite Frontend
    print("[2/2] 🎨 Launching Vite React Frontend on http://localhost:5173...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n✅ System is running!")
    print("👉 Web Application: http://localhost:5173")
    print("👉 Swagger API Docs: http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to terminate both processes.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Shutdown complete.")

if __name__ == "__main__":
    run()
