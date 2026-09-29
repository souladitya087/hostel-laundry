from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import execute_query

router = APIRouter(prefix="/slots", tags=["Slots"])

class SlotCreate(BaseModel):
    slot_date: str  # YYYY-MM-DD
    start_time: str # HH:MM
    end_time: str   # HH:MM
    capacity: int = 10

class SlotUpdate(BaseModel):
    slot_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

@router.get("")
def get_slots():
    # Use aggregation or view to calculate current booked count and occupancy
    sql = """
        SELECT 
            sl.slot_id,
            sl.slot_date,
            sl.start_time,
            sl.end_time,
            sl.capacity,
            sl.status as slot_status,
            COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) as booked_count,
            (sl.capacity - COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END)) as available_capacity,
            ROUND((CAST(COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) AS REAL) / sl.capacity) * 100, 1) as occupancy_percent
        FROM slots sl
        LEFT JOIN bookings b ON sl.slot_id = b.slot_id
        GROUP BY sl.slot_id
        ORDER BY sl.slot_date ASC, sl.start_time ASC;
    """
    return execute_query(sql)

@router.get("/available")
def get_available_slots():
    sql = """
        SELECT 
            sl.slot_id,
            sl.slot_date,
            sl.start_time,
            sl.end_time,
            sl.capacity,
            sl.status as slot_status,
            COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) as booked_count,
            (sl.capacity - COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END)) as available_capacity
        FROM slots sl
        LEFT JOIN bookings b ON sl.slot_id = b.slot_id
        WHERE sl.status = 'Available'
        GROUP BY sl.slot_id
        HAVING available_capacity > 0
        ORDER BY sl.slot_date ASC, sl.start_time ASC;
    """
    return execute_query(sql)

@router.get("/{slot_id}")
def get_slot(slot_id: int):
    sql = """
        SELECT sl.*, 
               COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) as booked_count
        FROM slots sl
        LEFT JOIN bookings b ON sl.slot_id = b.slot_id
        WHERE sl.slot_id = ?
        GROUP BY sl.slot_id;
    """
    slot = execute_query(sql, (slot_id,), fetch="one")
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found.")
    return slot

@router.post("", status_code=201)
def create_slot(data: SlotCreate):
    if data.capacity <= 0:
        raise HTTPException(status_code=400, detail="Capacity must be greater than zero.")
    
    # Check if duplicate slot interval exists
    check_sql = "SELECT slot_id FROM slots WHERE slot_date = ? AND start_time = ? AND end_time = ?;"
    existing = execute_query(check_sql, (data.slot_date, data.start_time, data.end_time), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="A slot already exists for this date and time interval.")
    
    insert_sql = """
        INSERT INTO slots (slot_date, start_time, end_time, capacity, status)
        VALUES (?, ?, ?, ?, 'Available');
    """
    new_id = execute_query(insert_sql, (data.slot_date, data.start_time, data.end_time, data.capacity), fetch="lastrowid")
    return {"slot_id": new_id, "message": "Slot created successfully"}

@router.put("/{slot_id}")
def update_slot(slot_id: int, data: SlotUpdate):
    existing = execute_query("SELECT * FROM slots WHERE slot_id = ?;", (slot_id,), fetch="one")
    if not existing:
        raise HTTPException(status_code=404, detail="Slot not found.")
    
    slot_date = data.slot_date if data.slot_date else existing["slot_date"]
    start_time = data.start_time if data.start_time else existing["start_time"]
    end_time = data.end_time if data.end_time else existing["end_time"]
    capacity = data.capacity if data.capacity is not None else existing["capacity"]
    status = data.status if data.status else existing["status"]

    if capacity <= 0:
        raise HTTPException(status_code=400, detail="Capacity must be greater than zero.")

    update_sql = """
        UPDATE slots
        SET slot_date = ?, start_time = ?, end_time = ?, capacity = ?, status = ?
        WHERE slot_id = ?;
    """
    execute_query(update_sql, (slot_date, start_time, end_time, capacity, status, slot_id), fetch="none")
    return {"message": "Slot updated successfully"}

@router.delete("/{slot_id}")
def delete_slot(slot_id: int):
    check_sql = "SELECT COUNT(*) as count FROM bookings WHERE slot_id = ?;"
    result = execute_query(check_sql, (slot_id,), fetch="one")
    if result and result["count"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete slot because it has {result['count']} bookings attached. Cancel bookings first."
        )
    
    execute_query("DELETE FROM slots WHERE slot_id = ?;", (slot_id,), fetch="none")
    return {"message": "Slot deleted successfully"}
