from fastapi import APIRouter
from backend.database import test_database_connection, init_db, execute_query

router = APIRouter(prefix="/db-admin", tags=["Database Administration"])

@router.get("/status")
def get_db_status():
    info = test_database_connection()
    # Fetch row counts for key tables
    counts = {}
    for tbl in ["students", "services", "slots", "bookings", "booking_items", "payments"]:
        try:
            res = execute_query(f"SELECT COUNT(*) as count FROM {tbl};", fetch="one")
            counts[tbl] = res["count"] if res else 0
        except Exception:
            counts[tbl] = 0
            
    info["table_counts"] = counts
    return info

@router.post("/reseed")
def reseed_database():
    res = init_db(force_reseed=True)
    return {"message": "Database successfully re-seeded with fresh sample data!", "details": res}
