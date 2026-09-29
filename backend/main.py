from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.config import settings
from backend.database import init_db, test_database_connection
from backend.routers import students, services, slots, bookings, payments, reports, db_admin, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables and initial seed data exist on startup
    init_db(force_reseed=False)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack DBMS Mini Project - Campus Laundry Slot Booking and Billing System with RESTful APIs for Web & Mobile clients.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend, localhost dev, and future mobile app origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers under API prefix
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(students.router, prefix=settings.API_PREFIX)
app.include_router(services.router, prefix=settings.API_PREFIX)
app.include_router(slots.router, prefix=settings.API_PREFIX)
app.include_router(bookings.router, prefix=settings.API_PREFIX)
app.include_router(payments.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(db_admin.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    db_info = test_database_connection()
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "database": db_info,
        "docs_url": "/docs",
        "api_endpoints": [
            f"{settings.API_PREFIX}/students",
            f"{settings.API_PREFIX}/services",
            f"{settings.API_PREFIX}/slots",
            f"{settings.API_PREFIX}/bookings",
            f"{settings.API_PREFIX}/payments",
            f"{settings.API_PREFIX}/reports/kpis",
            f"{settings.API_PREFIX}/db-admin/status"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
