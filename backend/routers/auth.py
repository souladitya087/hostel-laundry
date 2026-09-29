from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import execute_query

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    role: str # "admin" or "student"
    username: Optional[str] = None
    password: Optional[str] = None
    register_no: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    name: str
    register_no: str
    phone: str
    email: str
    room_no: str

@router.post("/login")
def login(data: LoginRequest):
    if data.role == "admin":
        user = (data.username or "").strip()
        pwd = (data.password or "").strip()
        # Default credentials for staff administration
        if user == "admin" and (pwd in ("admin", "admin123", "password")):
            return {
                "success": True,
                "role": "admin",
                "user": {
                    "username": "admin",
                    "name": "Hostel Operations Admin",
                    "role": "admin"
                },
                "message": "Admin authenticated successfully."
            }
        raise HTTPException(status_code=401, detail="Invalid admin credentials. Use admin / admin123")
    
    elif data.role == "student":
        reg = (data.register_no or "").strip().upper()
        if not reg:
            raise HTTPException(status_code=400, detail="Student Register Number is required.")
        
        student = execute_query(
            "SELECT * FROM students WHERE UPPER(register_no) = ?;", 
            (reg,), 
            fetch="one"
        )
        if not student:
            raise HTTPException(
                status_code=404, 
                detail=f"No student found with Register Number '{reg}'. Please register or check spelling."
            )
        
        return {
            "success": True,
            "role": "student",
            "user": {
                **student,
                "role": "student"
            },
            "message": f"Welcome back, {student['name']}!"
        }
    
    raise HTTPException(status_code=400, detail="Invalid role specified.")

@router.post("/register-student")
def register_student(data: StudentRegisterRequest):
    reg = data.register_no.strip().upper()
    existing = execute_query("SELECT student_id FROM students WHERE UPPER(register_no) = ?;", (reg,), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail=f"Student with Register Number {reg} is already registered.")

    insert_sql = """
        INSERT INTO students (name, register_no, phone, email, room_no)
        VALUES (?, ?, ?, ?, ?);
    """
    new_id = execute_query(
        insert_sql,
        (data.name.strip(), reg, data.phone.strip(), data.email.strip(), data.room_no.strip()),
        fetch="lastrowid"
    )
    student = execute_query("SELECT * FROM students WHERE student_id = ?;", (new_id,), fetch="one")
    return {
        "success": True,
        "role": "student",
        "user": {
            **student,
            "role": "student"
        },
        "message": "Registration successful! Welcome to Campus Laundry."
    }
