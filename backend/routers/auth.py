from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import execute_query

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    role: str # "admin" or "student"
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    register_no: Optional[str] = None

class StudentRegisterRequest(BaseModel):
    name: str
    register_no: str
    phone: str
    email: str
    password: str
    room_no: str

@router.get("/demo-users")
def get_demo_users():
    """Returns sample logins for rapid grading and demonstration."""
    sample_students = execute_query(
        "SELECT student_id, name, register_no, email, room_no, password FROM students LIMIT 4;"
    )
    sanitized = []
    for s in (sample_students or []):
        sanitized.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "register_no": s["register_no"],
            "email": s.get("email") or f"{s['register_no'].lower()}@campus.edu",
            "room_no": s["room_no"],
            "password": s.get("password") or "student123"
        })
    return {
        "admin": {
            "username": "admin",
            "email": "admin@campus.edu",
            "password": "admin123",
            "role": "admin",
            "name": "Hostel Operations Admin"
        },
        "sample_students": sanitized
    }

@router.post("/login")
def login(data: LoginRequest):
    role = (data.role or "").strip().lower()
    if role == "admin":
        user_identifier = (data.username or data.email or "").strip().lower()
        pwd = (data.password or "").strip()
        # Accept 'admin' username or 'admin@campus.edu' email
        if user_identifier in ("admin", "admin@campus.edu") and (pwd in ("admin", "admin123", "password")):
            return {
                "success": True,
                "role": "admin",
                "user": {
                    "username": "admin",
                    "email": "admin@campus.edu",
                    "name": "Hostel Operations Admin",
                    "role": "admin"
                },
                "message": "Admin authenticated successfully."
            }
        raise HTTPException(status_code=401, detail="Invalid admin credentials. Use admin / admin123")
    
    elif role == "student":
        # Support email primarily, with username/register_no fallback
        email_or_id = (data.email or data.username or data.register_no or "").strip()
        pwd = (data.password or "").strip()
        
        if not email_or_id:
            raise HTTPException(status_code=400, detail="College email is required.")
        if not pwd:
            raise HTTPException(status_code=400, detail="Password is required.")
        
        student = execute_query(
            "SELECT * FROM students WHERE LOWER(email) = LOWER(?) OR UPPER(register_no) = UPPER(?);", 
            (email_or_id, email_or_id), 
            fetch="one"
        )
        if not student:
            raise HTTPException(
                status_code=404, 
                detail=f"No student found with email or ID '{email_or_id}'. Please register below or check credentials."
            )
        
        expected_pwd = student.get("password") or "student123"
        if pwd != expected_pwd:
            raise HTTPException(status_code=401, detail="Incorrect password. (Default demo password is student123)")
        
        # Omit password in user response payload
        user_payload = {k: v for k, v in student.items() if k != "password"}
        user_payload["role"] = "student"
        
        return {
            "success": True,
            "role": "student",
            "user": user_payload,
            "message": f"Welcome back, {student['name']}!"
        }
    
    raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'admin' or 'student'.")

@router.post("/register-student")
def register_student(data: StudentRegisterRequest):
    email = data.email.strip().lower()
    reg = data.register_no.strip().upper()
    pwd = data.password.strip()

    name = (data.name or "").strip()
    phone = (data.phone or "").strip()
    room_no = (data.room_no or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not reg:
        raise HTTPException(status_code=400, detail="Register number is required.")
    if not phone:
        raise HTTPException(status_code=400, detail="Contact phone number is required.")
    if not room_no:
        raise HTTPException(status_code=400, detail="Hostel room number is required.")
    if not email or "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="A valid college email address is required (e.g. name@campus.edu).")
    if not pwd or len(pwd) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    existing_reg = execute_query("SELECT student_id FROM students WHERE UPPER(register_no) = ?;", (reg,), fetch="one")
    if existing_reg:
        raise HTTPException(status_code=400, detail=f"Student with Register Number '{reg}' is already registered.")

    existing_email = execute_query("SELECT student_id FROM students WHERE LOWER(email) = LOWER(?);", (email,), fetch="one")
    if existing_email:
        raise HTTPException(status_code=400, detail=f"Student with College Email '{email}' is already registered. Please sign in.")

    insert_sql = """
        INSERT INTO students (name, register_no, phone, email, password, room_no)
        VALUES (?, ?, ?, ?, ?, ?);
    """
    new_id = execute_query(
        insert_sql,
        (data.name.strip(), reg, data.phone.strip(), email, pwd, data.room_no.strip()),
        fetch="lastrowid"
    )
    student = execute_query("SELECT * FROM students WHERE student_id = ?;", (new_id,), fetch="one")
    user_payload = {k: v for k, v in student.items() if k != "password"}
    user_payload["role"] = "student"
    return {
        "success": True,
        "role": "student",
        "user": user_payload,
        "message": "Registration successful! Welcome to Campus Laundry."
    }
