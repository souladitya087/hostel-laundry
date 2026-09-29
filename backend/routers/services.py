from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import execute_query

router = APIRouter(prefix="/services", tags=["Services"])

class ServiceCreate(BaseModel):
    service_name: str
    unit_price: float
    turnaround_days: int
    description: Optional[str] = ""
    category: Optional[str] = "General"

class ServiceUpdate(BaseModel):
    service_name: Optional[str] = None
    unit_price: Optional[float] = None
    turnaround_days: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def get_services(include_inactive: bool = False):
    if include_inactive:
        sql = "SELECT * FROM services ORDER BY service_id ASC;"
    else:
        sql = "SELECT * FROM services WHERE is_active = 1 ORDER BY service_id ASC;"
    return execute_query(sql)

@router.get("/{service_id}")
def get_service(service_id: int):
    sql = "SELECT * FROM services WHERE service_id = ?;"
    service = execute_query(sql, (service_id,), fetch="one")
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")
    return service

@router.post("", status_code=201)
def create_service(data: ServiceCreate):
    if data.unit_price < 0:
        raise HTTPException(status_code=400, detail="Unit price cannot be negative.")
    if data.turnaround_days < 0:
        raise HTTPException(status_code=400, detail="Turnaround days cannot be negative.")

    check_sql = "SELECT service_id FROM services WHERE service_name = ?;"
    existing = execute_query(check_sql, (data.service_name.strip(),), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="A service with this name already exists.")

    insert_sql = """
        INSERT INTO services (service_name, unit_price, turnaround_days, description, category, is_active)
        VALUES (?, ?, ?, ?, ?, 1);
    """
    new_id = execute_query(
        insert_sql,
        (data.service_name.strip(), data.unit_price, data.turnaround_days, data.description.strip(), data.category.strip()),
        fetch="lastrowid"
    )
    return {"service_id": new_id, "message": "Service created successfully"}

@router.put("/{service_id}")
def update_service(service_id: int, data: ServiceUpdate):
    existing = execute_query("SELECT * FROM services WHERE service_id = ?;", (service_id,), fetch="one")
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found.")

    service_name = data.service_name.strip() if data.service_name else existing["service_name"]
    unit_price = data.unit_price if data.unit_price is not None else existing["unit_price"]
    turnaround_days = data.turnaround_days if data.turnaround_days is not None else existing["turnaround_days"]
    description = data.description if data.description is not None else existing["description"]
    category = data.category if data.category is not None else existing["category"]
    is_active = 1 if (data.is_active if data.is_active is not None else existing["is_active"]) else 0

    update_sql = """
        UPDATE services
        SET service_name = ?, unit_price = ?, turnaround_days = ?, description = ?, category = ?, is_active = ?
        WHERE service_id = ?;
    """
    execute_query(update_sql, (service_name, unit_price, turnaround_days, description, category, is_active, service_id), fetch="none")
    return {"message": "Service updated successfully"}

@router.delete("/{service_id}")
def delete_service(service_id: int):
    # Check if used in booking items
    check_sql = "SELECT COUNT(*) as count FROM booking_items WHERE service_id = ?;"
    result = execute_query(check_sql, (service_id,), fetch="one")
    if result and result["count"] > 0:
        # Soft delete instead to maintain referential integrity
        execute_query("UPDATE services SET is_active = 0 WHERE service_id = ?;", (service_id,), fetch="none")
        return {"message": f"Service is used in {result['count']} bookings. Marked as inactive (soft delete) to preserve database integrity."}
    
    execute_query("DELETE FROM services WHERE service_id = ?;", (service_id,), fetch="none")
    return {"message": "Service deleted successfully"}
