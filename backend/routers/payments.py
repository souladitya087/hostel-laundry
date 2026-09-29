from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import execute_query

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    booking_id: int
    paid_amount: float
    payment_method: str = "UPI" # UPI, Cash, Student ID Card, Online
    transaction_ref: Optional[str] = None

@router.get("")
def get_payments():
    sql = """
        SELECT 
            p.*,
            b.pickup_code,
            b.total_amount as booking_total,
            s.name as student_name,
            s.register_no
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN students s ON b.student_id = s.student_id
        ORDER BY p.payment_id DESC;
    """
    return execute_query(sql)

@router.post("", status_code=201)
def create_payment(data: PaymentCreate):
    booking = execute_query("SELECT booking_id, total_amount FROM bookings WHERE booking_id = ?;", (data.booking_id,), fetch="one")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if data.paid_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")

    insert_sql = """
        INSERT INTO payments (booking_id, paid_amount, payment_method, payment_status, transaction_ref)
        VALUES (?, ?, ?, 'Paid', ?);
    """
    payment_id = execute_query(
        insert_sql,
        (data.booking_id, data.paid_amount, data.payment_method, data.transaction_ref or f"PAY-{data.booking_id}"),
        fetch="lastrowid"
    )
    return {"payment_id": payment_id, "message": "Payment recorded successfully"}
