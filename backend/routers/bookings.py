from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.database import execute_query, generate_pickup_code

router = APIRouter(prefix="/bookings", tags=["Bookings"])

class BookingItemInput(BaseModel):
    service_id: int
    quantity: int = Field(gt=0, description="Quantity of clothes must be greater than 0")

class InitialPaymentInput(BaseModel):
    paid_amount: float
    payment_method: str = "UPI"
    transaction_ref: Optional[str] = None

class BookingCreate(BaseModel):
    student_id: int
    slot_id: int
    items: List[BookingItemInput]
    notes: Optional[str] = ""
    payment: Optional[InitialPaymentInput] = None

class BookingStatusUpdate(BaseModel):
    status: str

@router.get("")
def get_bookings(
    status: Optional[str] = Query(None, description="Filter by status"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    q: Optional[str] = Query(None, description="Search by student name, register_no, or pickup code"),
    date: Optional[str] = Query(None, description="Filter by slot date (YYYY-MM-DD)")
):
    sql = """
        SELECT 
            b.booking_id,
            b.pickup_code,
            b.booking_date,
            b.status as booking_status,
            b.total_amount,
            b.notes,
            s.student_id,
            s.name as student_name,
            s.register_no,
            s.phone as student_phone,
            s.room_no,
            sl.slot_id,
            sl.slot_date,
            sl.start_time,
            sl.end_time,
            COUNT(bi.item_id) as total_items,
            COALESCE(SUM(bi.quantity), 0) as total_clothes,
            COALESCE(p.payment_status, 'Unpaid') as payment_status,
            p.payment_method,
            p.paid_amount
        FROM bookings b
        JOIN students s ON b.student_id = s.student_id
        JOIN slots sl ON b.slot_id = sl.slot_id
        LEFT JOIN booking_items bi ON b.booking_id = bi.booking_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE 1=1
    """
    params = []

    if status:
        sql += " AND b.status = ?"
        params.append(status)
    if student_id:
        sql += " AND b.student_id = ?"
        params.append(student_id)
    if date:
        sql += " AND sl.slot_date = ?"
        params.append(date)
    if q:
        sql += " AND (s.name LIKE ? OR s.register_no LIKE ? OR b.pickup_code LIKE ?)"
        term = f"%{q}%"
        params.extend([term, term, term])

    sql += """
        GROUP BY b.booking_id
        ORDER BY b.booking_id DESC;
    """
    return execute_query(sql, tuple(params))

@router.get("/{booking_id}")
def get_booking(booking_id: int):
    # Fetch core booking header
    header_sql = """
        SELECT 
            b.booking_id,
            b.pickup_code,
            b.booking_date,
            b.status as booking_status,
            b.total_amount,
            b.notes,
            s.student_id,
            s.name as student_name,
            s.register_no,
            s.phone as student_phone,
            s.email as student_email,
            s.room_no,
            sl.slot_id,
            sl.slot_date,
            sl.start_time,
            sl.end_time
        FROM bookings b
        JOIN students s ON b.student_id = s.student_id
        JOIN slots sl ON b.slot_id = sl.slot_id
        WHERE b.booking_id = ?;
    """
    booking = execute_query(header_sql, (booking_id,), fetch="one")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Fetch booking line items
    items_sql = """
        SELECT 
            bi.item_id,
            bi.service_id,
            srv.service_name,
            srv.turnaround_days,
            bi.quantity,
            bi.unit_price,
            bi.line_total
        FROM booking_items bi
        JOIN services srv ON bi.service_id = srv.service_id
        WHERE bi.booking_id = ?
        ORDER BY bi.item_id ASC;
    """
    items = execute_query(items_sql, (booking_id,))
    booking["items"] = items

    # Fetch payment info
    payments_sql = """
        SELECT payment_id, paid_amount, payment_date, payment_method, payment_status, transaction_ref
        FROM payments
        WHERE booking_id = ?
        ORDER BY payment_id DESC;
    """
    payments = execute_query(payments_sql, (booking_id,))
    booking["payments"] = payments
    booking["payment"] = payments[0] if payments else None

    return booking

@router.post("", status_code=201)
def create_booking(data: BookingCreate):
    # 1. Validate student
    student = execute_query("SELECT student_id FROM students WHERE student_id = ?;", (data.student_id,), fetch="one")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 2. Validate slot and capacity
    slot = execute_query("SELECT * FROM slots WHERE slot_id = ?;", (data.slot_id,), fetch="one")
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found.")
    
    if slot["status"] == "Maintenance":
        raise HTTPException(status_code=400, detail="The selected slot is currently under maintenance.")

    count_res = execute_query(
        "SELECT COUNT(*) as booked FROM bookings WHERE slot_id = ? AND status != 'Cancelled';", 
        (data.slot_id,), 
        fetch="one"
    )
    current_booked = count_res["booked"] if count_res else 0
    if current_booked >= slot["capacity"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Slot is fully booked! Capacity is {slot['capacity']} and all slots are reserved."
        )

    # 3. Validate items list
    if not data.items:
        raise HTTPException(status_code=400, detail="Booking must contain at least one laundry service item.")

    pickup_code = generate_pickup_code()

    # 4. Insert booking header
    insert_booking_sql = """
        INSERT INTO bookings (student_id, slot_id, status, total_amount, pickup_code, notes)
        VALUES (?, ?, 'Pending', 0.00, ?, ?);
    """
    booking_id = execute_query(
        insert_booking_sql,
        (data.student_id, data.slot_id, pickup_code, data.notes or ""),
        fetch="lastrowid"
    )

    # 5. Insert booking line items and compute total
    total_calculated = 0.0
    for item in data.items:
        srv = execute_query("SELECT service_id, unit_price FROM services WHERE service_id = ?;", (item.service_id,), fetch="one")
        if not srv:
            raise HTTPException(status_code=400, detail=f"Service ID {item.service_id} does not exist.")
        
        unit_price = float(srv["unit_price"])
        line_total = round(unit_price * item.quantity, 2)
        total_calculated += line_total

        insert_item_sql = """
            INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?);
        """
        execute_query(insert_item_sql, (booking_id, item.service_id, item.quantity, unit_price, line_total), fetch="none")

    # Update total_amount in booking (as safety measure in addition to triggers)
    execute_query("UPDATE bookings SET total_amount = ? WHERE booking_id = ?;", (total_calculated, booking_id), fetch="none")

    # 6. Optional Payment Record
    if data.payment and data.payment.paid_amount > 0:
        insert_pay_sql = """
            INSERT INTO payments (booking_id, paid_amount, payment_method, payment_status, transaction_ref)
            VALUES (?, ?, ?, 'Paid', ?);
        """
        execute_query(
            insert_pay_sql,
            (booking_id, data.payment.paid_amount, data.payment.payment_method, data.payment.transaction_ref or f"TX-{generate_pickup_code()}"),
            fetch="none"
        )

    # 7. Check if slot became full
    if (current_booked + 1) >= slot["capacity"]:
        execute_query("UPDATE slots SET status = 'Full' WHERE slot_id = ?;", (data.slot_id,), fetch="none")

    return {
        "booking_id": booking_id,
        "pickup_code": pickup_code,
        "total_amount": total_calculated,
        "message": "Laundry booking successfully created!"
    }

@router.patch("/{booking_id}/status")
def update_booking_status(booking_id: int, data: BookingStatusUpdate):
    valid_statuses = ['Pending', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled']
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    booking = execute_query("SELECT slot_id, status FROM bookings WHERE booking_id = ?;", (booking_id,), fetch="one")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    execute_query("UPDATE bookings SET status = ? WHERE booking_id = ?;", (data.status, booking_id), fetch="none")

    # If cancelled, check if slot should revert to 'Available'
    if data.status == "Cancelled":
        slot_id = booking["slot_id"]
        slot = execute_query("SELECT capacity, status FROM slots WHERE slot_id = ?;", (slot_id,), fetch="one")
        if slot and slot["status"] == "Full":
            count_res = execute_query(
                "SELECT COUNT(*) as booked FROM bookings WHERE slot_id = ? AND status != 'Cancelled';", 
                (slot_id,), 
                fetch="one"
            )
            if count_res and count_res["booked"] < slot["capacity"]:
                execute_query("UPDATE slots SET status = 'Available' WHERE slot_id = ?;", (slot_id,), fetch="none")

    return {"message": f"Booking status updated to {data.status}"}

@router.delete("/{booking_id}")
def cancel_booking(booking_id: int):
    # Cancelling booking rather than hard-deleting preserves financial & audit history
    return update_booking_status(booking_id, BookingStatusUpdate(status="Cancelled"))
