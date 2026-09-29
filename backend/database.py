import os
import sqlite3
import random
import string
from datetime import datetime, date, time
from typing import Dict, Any, List, Optional
from backend.config import settings

# Attempt MySQL driver imports
try:
    import pymysql
    from pymysql.cursors import DictCursor
    HAS_PYMYSQL = True
except ImportError:
    HAS_PYMYSQL = False

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "laundry_local.db")
_active_engine = "Unknown"

def get_mysql_connection():
    if not HAS_PYMYSQL:
        raise ConnectionError("PyMySQL is not installed.")
    
    # Try connecting without database first to ensure database exists
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=True
    )
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME};")
    conn.select_db(settings.DB_NAME)
    return conn

def get_sqlite_connection():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def test_database_connection() -> Dict[str, Any]:
    global _active_engine
    if not settings.USE_SQLITE_FALLBACK:
        try:
            conn = get_mysql_connection()
            conn.close()
            _active_engine = "MySQL 8.0"
            return {"engine": "MySQL 8.0", "status": "connected", "database": settings.DB_NAME}
        except Exception as e:
            return {"engine": "MySQL 8.0", "status": "error", "error": str(e)}
    else:
        # Try MySQL first, fallback to SQLite if failed
        try:
            conn = get_mysql_connection()
            conn.close()
            _active_engine = "MySQL 8.0"
            return {"engine": "MySQL 8.0", "status": "connected", "database": settings.DB_NAME}
        except Exception:
            _active_engine = "SQLite 3 (Fallback)"
            return {"engine": "SQLite 3 (Fallback)", "status": "connected", "database": SQLITE_PATH}

def get_db():
    global _active_engine
    if _active_engine == "MySQL 8.0":
        try:
            return get_mysql_connection(), "mysql"
        except Exception:
            if settings.USE_SQLITE_FALLBACK:
                _active_engine = "SQLite 3 (Fallback)"
                return get_sqlite_connection(), "sqlite"
            raise
    elif _active_engine == "SQLite 3 (Fallback)":
        return get_sqlite_connection(), "sqlite"
    else:
        # Initial check
        info = test_database_connection()
        if "MySQL" in info["engine"] and info["status"] == "connected":
            _active_engine = "MySQL 8.0"
            return get_mysql_connection(), "mysql"
        else:
            _active_engine = "SQLite 3 (Fallback)"
            return get_sqlite_connection(), "sqlite"

from decimal import Decimal
from datetime import timedelta

def serialize_db_val(val):
    if isinstance(val, timedelta):
        total_seconds = int(val.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
    elif isinstance(val, (date, datetime)):
        return str(val)
    elif isinstance(val, Decimal):
        return float(val)
    return val

def format_row(row):
    if not row:
        return row
    if isinstance(row, dict):
        return {k: serialize_db_val(v) for k, v in row.items()}
    return row

def execute_query(sql: str, params: tuple = (), fetch: str = "all") -> Any:
    conn, engine = get_db()
    try:
        if engine == "mysql":
            with conn.cursor() as cur:
                # Replace '?' placeholders with '%s' for MySQL
                formatted_sql = sql.replace("?", "%s")
                cur.execute(formatted_sql, params)
                if fetch == "all":
                    rows = cur.fetchall()
                    return [format_row(r) for r in rows]
                elif fetch == "one":
                    row = cur.fetchone()
                    return format_row(row)
                elif fetch == "lastrowid":
                    return cur.lastrowid
                return cur.rowcount
        else:
            cur = conn.cursor()
            cur.execute(sql, params)
            if fetch == "all":
                rows = cur.fetchall()
                return [format_row(dict(ix)) for ix in rows]
            elif fetch == "one":
                row = cur.fetchone()
                return format_row(dict(row)) if row else None
            elif fetch == "lastrowid":
                conn.commit()
                return cur.lastrowid
            conn.commit()
            return cur.rowcount
    finally:
        conn.close()

def generate_pickup_code() -> str:
    chars = "".join(random.choices(string.digits, k=4))
    return f"LND-{chars}"

def clean_sql_file(file_path: str) -> List[str]:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    lines = []
    for line in content.splitlines():
        trimmed = line.strip()
        if trimmed.startswith("--"):
            continue
        lines.append(line)
    clean_text = "\n".join(lines)
    return [s.strip() for s in clean_text.split(";") if s.strip()]

def init_db(force_reseed: bool = False):
    """
    Initializes tables, views, triggers, and seed data.
    Works seamlessly for both MySQL and SQLite fallback.
    """
    conn, engine = get_db()
    try:
        if engine == "mysql":
            sql_dir = os.path.join(os.path.dirname(__file__), "sql")
            with conn.cursor() as cur:
                # Check if students table already has data
                cur.execute("SHOW TABLES LIKE 'students';")
                exists = cur.fetchone()
                if exists and not force_reseed:
                    return {"engine": "MySQL 8.0", "status": "already_initialized"}

                # Run schema
                for stmt in clean_sql_file(os.path.join(sql_dir, "01_schema.sql")):
                    cur.execute(stmt)

                # Run views
                for stmt in clean_sql_file(os.path.join(sql_dir, "02_views.sql")):
                    cur.execute(stmt)

                # Run seed data
                for stmt in clean_sql_file(os.path.join(sql_dir, "04_seed_data.sql")):
                    cur.execute(stmt)
                
            return {"engine": "MySQL 8.0", "status": "initialized_successfully"}
        else:
            # SQLite initialization
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='students';")
            exists = cur.fetchone()
            if exists and not force_reseed:
                return {"engine": "SQLite 3", "status": "already_initialized"}

            cur.executescript("""
                DROP TABLE IF EXISTS payments;
                DROP TABLE IF EXISTS booking_items;
                DROP TABLE IF EXISTS bookings;
                DROP TABLE IF EXISTS slots;
                DROP TABLE IF EXISTS services;
                DROP TABLE IF EXISTS students;

                CREATE TABLE students (
                    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    register_no TEXT NOT NULL UNIQUE,
                    phone TEXT NOT NULL,
                    email TEXT NOT NULL,
                    room_no TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE services (
                    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    service_name TEXT NOT NULL UNIQUE,
                    unit_price REAL NOT NULL CHECK (unit_price >= 0),
                    turnaround_days INTEGER NOT NULL DEFAULT 1 CHECK (turnaround_days >= 0),
                    description TEXT,
                    category TEXT DEFAULT 'General',
                    is_active INTEGER DEFAULT 1
                );

                CREATE TABLE slots (
                    slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    slot_date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    capacity INTEGER NOT NULL DEFAULT 10 CHECK (capacity > 0),
                    status TEXT DEFAULT 'Available',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (slot_date, start_time, end_time)
                );

                CREATE TABLE bookings (
                    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    slot_id INTEGER NOT NULL,
                    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'Pending',
                    total_amount REAL NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
                    pickup_code TEXT NOT NULL UNIQUE,
                    notes TEXT,
                    FOREIGN KEY (student_id) REFERENCES students(student_id),
                    FOREIGN KEY (slot_id) REFERENCES slots(slot_id)
                );

                CREATE TABLE booking_items (
                    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER NOT NULL,
                    service_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
                    unit_price REAL NOT NULL CHECK (unit_price >= 0),
                    line_total REAL NOT NULL CHECK (line_total >= 0),
                    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
                    FOREIGN KEY (service_id) REFERENCES services(service_id)
                );

                CREATE TABLE payments (
                    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER NOT NULL,
                    paid_amount REAL NOT NULL CHECK (paid_amount > 0),
                    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    payment_method TEXT NOT NULL DEFAULT 'UPI',
                    payment_status TEXT NOT NULL DEFAULT 'Paid',
                    transaction_ref TEXT,
                    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
                );

                -- Triggers for automatic total recalculation
                CREATE TRIGGER IF NOT EXISTS trg_items_insert AFTER INSERT ON booking_items
                BEGIN
                    UPDATE bookings
                    SET total_amount = (
                        SELECT COALESCE(SUM(line_total), 0.0) 
                        FROM booking_items 
                        WHERE booking_id = NEW.booking_id
                    )
                    WHERE booking_id = NEW.booking_id;
                END;

                CREATE TRIGGER IF NOT EXISTS trg_items_update AFTER UPDATE ON booking_items
                BEGIN
                    UPDATE bookings
                    SET total_amount = (
                        SELECT COALESCE(SUM(line_total), 0.0) 
                        FROM booking_items 
                        WHERE booking_id = NEW.booking_id
                    )
                    WHERE booking_id = NEW.booking_id;
                END;

                CREATE TRIGGER IF NOT EXISTS trg_items_delete AFTER DELETE ON booking_items
                BEGIN
                    UPDATE bookings
                    SET total_amount = (
                        SELECT COALESCE(SUM(line_total), 0.0) 
                        FROM booking_items 
                        WHERE booking_id = OLD.booking_id
                    )
                    WHERE booking_id = OLD.booking_id;
                END;

                -- Views
                DROP VIEW IF EXISTS vw_booking_summary;
                CREATE VIEW vw_booking_summary AS
                SELECT 
                    b.booking_id,
                    b.pickup_code,
                    b.booking_date,
                    b.status AS booking_status,
                    b.total_amount,
                    s.student_id,
                    s.name AS student_name,
                    s.register_no,
                    s.phone AS student_phone,
                    s.room_no,
                    sl.slot_id,
                    sl.slot_date,
                    sl.start_time,
                    sl.end_time,
                    COUNT(bi.item_id) AS distinct_services_count,
                    COALESCE(SUM(bi.quantity), 0) AS total_clothes_count,
                    COALESCE(p.payment_status, 'Unpaid') AS payment_status,
                    p.payment_method,
                    p.paid_amount
                FROM bookings b
                JOIN students s ON b.student_id = s.student_id
                JOIN slots sl ON b.slot_id = sl.slot_id
                LEFT JOIN booking_items bi ON b.booking_id = bi.booking_id
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                GROUP BY b.booking_id;

                DROP VIEW IF EXISTS vw_slot_utilization;
                CREATE VIEW vw_slot_utilization AS
                SELECT 
                    sl.slot_id,
                    sl.slot_date,
                    sl.start_time,
                    sl.end_time,
                    sl.capacity,
                    sl.status AS slot_status,
                    COUNT(b.booking_id) AS booked_count,
                    (sl.capacity - COUNT(b.booking_id)) AS available_capacity,
                    ROUND((CAST(COUNT(b.booking_id) AS REAL) / sl.capacity) * 100, 1) AS occupancy_percent
                FROM slots sl
                LEFT JOIN bookings b ON sl.slot_id = b.slot_id AND b.status != 'Cancelled'
                GROUP BY sl.slot_id;

                -- Seed Data
                INSERT INTO students (name, register_no, phone, email, room_no) VALUES
                ('Aditya Sharma', '2024CS01', '+91 98765 43210', 'aditya.cs24@campus.edu', 'BH-204'),
                ('Priya Patel', '2024IT15', '+91 98765 43211', 'priya.it24@campus.edu', 'GH-102'),
                ('Rohan Verma', '2023ME42', '+91 98765 43212', 'rohan.me23@campus.edu', 'BH-315'),
                ('Sneha Kulkarni', '2024EC08', '+91 98765 43213', 'sneha.ec24@campus.edu', 'GH-208'),
                ('Aman Gupta', '2023CS88', '+91 98765 43214', 'aman.cs23@campus.edu', 'BH-112'),
                ('Ananya Iyer', '2024DS19', '+91 98765 43215', 'ananya.ds24@campus.edu', 'GH-304'),
                ('Karthik Nair', '2023EE31', '+91 98765 43216', 'karthik.ee23@campus.edu', 'BH-401'),
                ('Meera Joshi', '2024AI05', '+91 98765 43217', 'meera.ai24@campus.edu', 'GH-115'),
                ('Varun Reddy', '2023CE22', '+91 98765 43218', 'varun.ce23@campus.edu', 'BH-220'),
                ('Tanvi Deshmukh', '2024IT77', '+91 98765 43219', 'tanvi.it24@campus.edu', 'GH-219'),
                ('Siddharth Rao', '2023CS50', '+91 98765 43220', 'sid.cs23@campus.edu', 'BH-105'),
                ('Pooja Mehta', '2024EC33', '+91 98765 43221', 'pooja.ec24@campus.edu', 'GH-312');

                INSERT INTO services (service_name, unit_price, turnaround_days, description, category, is_active) VALUES
                ('Wash & Fold', 30.00, 1, 'Standard machine washing, tumble drying, and neat folding', 'Everyday', 1),
                ('Wash & Steam Iron', 50.00, 2, 'Deep fabric wash followed by crisp vertical steam pressing', 'Everyday', 1),
                ('Express Same-Day Wash', 80.00, 0, 'Priority rush service washed, dried, and folded within 6 hours', 'Express', 1),
                ('Dry Cleaning (Suits / Blazers)', 180.00, 3, 'Professional chemical dry cleaning for blazers, coats, and formalwear', 'Specialty', 1),
                ('Heavy Bedding & Blankets', 120.00, 2, 'Large capacity thermal drum wash for comforters, quilts, and bedspreads', 'Heavy', 1),
                ('Sneakers & Shoe Spa', 150.00, 2, 'Deep dirt extraction, midsole brightening, and odor disinfection', 'Footwear', 1);

                INSERT INTO slots (slot_date, start_time, end_time, capacity, status) VALUES
                (date('now'), '08:00', '10:00', 8, 'Available'),
                (date('now'), '11:00', '13:00', 10, 'Available'),
                (date('now'), '14:00', '16:00', 10, 'Available'),
                (date('now'), '17:00', '19:00', 8, 'Available'),
                (date('now'), '19:30', '21:30', 6, 'Available'),
                (date('now', '+1 day'), '08:00', '10:00', 10, 'Available'),
                (date('now', '+1 day'), '11:00', '13:00', 10, 'Available'),
                (date('now', '+1 day'), '14:00', '16:00', 10, 'Available'),
                (date('now', '+1 day'), '17:00', '19:00', 8, 'Available'),
                (date('now', '+2 day'), '09:00', '12:00', 12, 'Available'),
                (date('now', '+2 day'), '14:00', '17:00', 12, 'Available');

                INSERT INTO bookings (student_id, slot_id, booking_date, status, total_amount, pickup_code, notes) VALUES
                (1, 1, datetime('now', '-2 hours'), 'In Progress', 210.00, 'LND-2401', 'Please separate white shirts'),
                (2, 2, datetime('now', '-1 hours'), 'Ready for Pickup', 180.00, 'LND-2402', 'Hostel formal event blazer'),
                (3, 1, datetime('now'), 'Pending', 90.00, 'LND-2403', 'Standard wash'),
                (4, 3, datetime('now'), 'Completed', 150.00, 'LND-2404', 'Sports shoes cleaning'),
                (5, 4, datetime('now'), 'Pending', 240.00, 'LND-2405', 'Two heavy winter blankets');

                INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, line_total) VALUES
                (1, 1, 3, 30.00, 90.00),
                (1, 5, 1, 120.00, 120.00),
                (2, 4, 1, 180.00, 180.00),
                (3, 1, 3, 30.00, 90.00),
                (4, 6, 1, 150.00, 150.00),
                (5, 5, 2, 120.00, 240.00);

                INSERT INTO payments (booking_id, paid_amount, payment_method, payment_status, transaction_ref) VALUES
                (1, 210.00, 'UPI', 'Paid', 'UPI/2026/99812'),
                (2, 180.00, 'Student ID Card', 'Paid', 'CARD-88123'),
                (4, 150.00, 'UPI', 'Paid', 'UPI/2026/77412'),
                (5, 240.00, 'Cash', 'Paid', 'CASH-REC-045');
            """)
            conn.commit()
            return {"engine": "SQLite 3", "status": "initialized_successfully"}
    finally:
        conn.close()
