from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from backend.database import execute_query

router = APIRouter(prefix="/students", tags=["Students"])

class StudentCreate(BaseModel):
    name: str
    register_no: str
    phone: str
    email: str
    room_no: str
    password: Optional[str] = "student123"

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    room_no: Optional[str] = None
    password: Optional[str] = None

@router.get("")
def get_students(q: Optional[str] = Query(None, description="Search by name, register_no or room")):
    q_val = q if isinstance(q, str) and q.strip() else None
    if q_val:
        like_term = f"%{q_val}%"
        sql = """
            SELECT s.*, 
                   COUNT(b.booking_id) as total_bookings
            FROM students s
            LEFT JOIN bookings b ON s.student_id = b.student_id
            WHERE s.name LIKE ? OR s.register_no LIKE ? OR s.room_no LIKE ?
            GROUP BY s.student_id
            ORDER BY s.student_id DESC;
        """
        return execute_query(sql, (like_term, like_term, like_term))
    else:
        sql = """
            SELECT s.*, 
                   COUNT(b.booking_id) as total_bookings
            FROM students s
            LEFT JOIN bookings b ON s.student_id = b.student_id
            GROUP BY s.student_id
            ORDER BY s.student_id DESC;
        """
        return execute_query(sql)

@router.get("/{student_id}")
def get_student(student_id: int):
    sql = "SELECT * FROM students WHERE student_id = ?;"
    student = execute_query(sql, (student_id,), fetch="one")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    # Fetch student's booking history
    bookings_sql = """
        SELECT b.*, sl.slot_date, sl.start_time, sl.end_time 
        FROM bookings b
        JOIN slots sl ON b.slot_id = sl.slot_id
        WHERE b.student_id = ?
        ORDER BY b.booking_id DESC;
    """
    bookings = execute_query(bookings_sql, (student_id,))
    student["bookings"] = bookings
    return student

@router.post("", status_code=201)
def create_student(data: StudentCreate):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Student name cannot be empty.")
    if not data.phone or not data.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number cannot be empty.")
    if not data.email or "@" not in data.email or "." not in data.email:
        raise HTTPException(status_code=400, detail="A valid college email address is required.")
    if not data.room_no or not data.room_no.strip():
        raise HTTPException(status_code=400, detail="Hostel room number cannot be empty.")

    # Check if register_no or email is already taken
    check_sql = "SELECT student_id FROM students WHERE register_no = ? OR LOWER(email) = LOWER(?);"
    existing = execute_query(check_sql, (data.register_no.strip().upper(), data.email.strip().lower()), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="Student with this Register Number or Email already exists.")
    
    insert_sql = """
        INSERT INTO students (name, register_no, phone, email, password, room_no)
        VALUES (?, ?, ?, ?, ?, ?);
    """
    new_id = execute_query(
        insert_sql, 
        (data.name.strip(), data.register_no.strip().upper(), data.phone.strip(), data.email.strip().lower(), (data.password or "student123").strip(), data.room_no.strip()),
        fetch="lastrowid"
    )
    return {"student_id": new_id, "message": "Student created successfully"}

@router.put("/{student_id}")
def update_student(student_id: int, data: StudentUpdate):
    existing = execute_query("SELECT * FROM students WHERE student_id = ?;", (student_id,), fetch="one")
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    name = data.name.strip() if data.name is not None else existing["name"]
    if not name:
        raise HTTPException(status_code=400, detail="Student name cannot be empty.")

    phone = data.phone.strip() if data.phone is not None else existing["phone"]
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number cannot be empty.")

    room_no = data.room_no.strip() if data.room_no is not None else existing["room_no"]
    if not room_no:
        raise HTTPException(status_code=400, detail="Room number cannot be empty.")

    if data.email is not None:
        email = data.email.strip().lower()
        if not email or "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="A valid college email address is required.")
        # Check if email is taken by another student
        email_conflict = execute_query(
            "SELECT student_id FROM students WHERE LOWER(email) = LOWER(?) AND student_id != ?;",
            (email, student_id),
            fetch="one"
        )
        if email_conflict:
            raise HTTPException(status_code=400, detail=f"Student with college email '{email}' already exists.")
    else:
        email = existing["email"]

    password = data.password.strip() if data.password else existing.get("password", "student123")
    
    update_sql = """
        UPDATE students 
        SET name = ?, phone = ?, email = ?, password = ?, room_no = ?
        WHERE student_id = ?;
    """
    execute_query(update_sql, (name, phone, email, password, room_no, student_id), fetch="none")
    return {"message": "Student profile updated successfully"}

@router.delete("/{student_id}")
def delete_student(student_id: int):
    # Check if student has existing bookings (FK constraint protection)
    check_sql = "SELECT COUNT(*) as count FROM bookings WHERE student_id = ?;"
    result = execute_query(check_sql, (student_id,), fetch="one")
    if result and result["count"] > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete student with ID {student_id} because they have {result['count']} existing booking records (Referential Integrity Constraint)."
        )
    
    delete_sql = "DELETE FROM students WHERE student_id = ?;"
    execute_query(delete_sql, (student_id,), fetch="none")
    return {"message": "Student deleted successfully"}
