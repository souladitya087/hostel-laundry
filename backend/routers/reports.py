from fastapi import APIRouter
from backend.database import execute_query

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/kpis")
def get_dashboard_kpis():
    # 1. Total Students
    students_res = execute_query("SELECT COUNT(*) as count FROM students;", fetch="one")
    total_students = students_res["count"] if students_res else 0

    # 2. Active Bookings (Pending, In Progress, Ready for Pickup)
    active_res = execute_query(
        "SELECT COUNT(*) as count FROM bookings WHERE status IN ('Pending', 'In Progress', 'Ready for Pickup');", 
        fetch="one"
    )
    active_bookings = active_res["count"] if active_res else 0

    # 3. Total Completed Bookings
    completed_res = execute_query("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed';", fetch="one")
    completed_bookings = completed_res["count"] if completed_res else 0

    # 4. Total Revenue Collected
    revenue_res = execute_query("SELECT COALESCE(SUM(paid_amount), 0.0) as total FROM payments WHERE payment_status = 'Paid';", fetch="one")
    total_revenue = revenue_res["total"] if revenue_res else 0.0

    # 5. Total Clothes / Items Processed
    clothes_res = execute_query("SELECT COALESCE(SUM(quantity), 0) as total FROM booking_items;", fetch="one")
    total_clothes = clothes_res["total"] if clothes_res else 0

    # 6. Overall Slot Occupancy %
    occupancy_sql = """
        SELECT 
            SUM(capacity) as total_capacity,
            (SELECT COUNT(*) FROM bookings WHERE status != 'Cancelled') as total_booked
        FROM slots;
    """
    occ_res = execute_query(occupancy_sql, fetch="one")
    total_cap = occ_res["total_capacity"] if occ_res and occ_res["total_capacity"] else 1
    total_b = occ_res["total_booked"] if occ_res and occ_res["total_booked"] else 0
    avg_occupancy = round((total_b / total_cap) * 100, 1) if total_cap > 0 else 0.0

    return {
        "total_students": total_students,
        "active_bookings": active_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": total_revenue,
        "total_clothes_washed": total_clothes,
        "slot_occupancy_rate": min(avg_occupancy, 100.0)
    }

@router.get("/daily-revenue")
def get_daily_revenue():
    sql = """
        SELECT 
            DATE(b.booking_date) as report_date,
            COUNT(b.booking_id) as total_bookings,
            SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
            COALESCE(SUM(b.total_amount), 0.0) as total_billed,
            COALESCE(SUM(p.paid_amount), 0.0) as total_collected
        FROM bookings b
        LEFT JOIN payments p ON b.booking_id = p.booking_id AND p.payment_status = 'Paid'
        GROUP BY DATE(b.booking_date)
        ORDER BY report_date DESC
        LIMIT 14;
    """
    return execute_query(sql)

@router.get("/service-analytics")
def get_service_analytics():
    sql = """
        SELECT 
            srv.service_id,
            srv.service_name,
            srv.unit_price,
            srv.category,
            COUNT(bi.item_id) as total_bookings_count,
            COALESCE(SUM(bi.quantity), 0) as total_clothes_cleaned,
            COALESCE(SUM(bi.line_total), 0.0) as total_revenue
        FROM services srv
        LEFT JOIN booking_items bi ON srv.service_id = bi.service_id
        LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status != 'Cancelled'
        GROUP BY srv.service_id
        ORDER BY total_revenue DESC;
    """
    return execute_query(sql)

@router.get("/slot-utilization")
def get_slot_utilization():
    sql = """
        SELECT 
            sl.slot_id,
            sl.slot_date,
            sl.start_time,
            sl.end_time,
            sl.capacity,
            sl.status as slot_status,
            COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) as booked_count,
            (sl.capacity - COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END)) as available_seats,
            ROUND((CAST(COUNT(CASE WHEN b.status != 'Cancelled' THEN b.booking_id END) AS REAL) / sl.capacity) * 100, 1) as occupancy_pct
        FROM slots sl
        LEFT JOIN bookings b ON sl.slot_id = b.slot_id
        GROUP BY sl.slot_id
        ORDER BY sl.slot_date ASC, sl.start_time ASC;
    """
    return execute_query(sql)

@router.get("/recent-activity")
def get_recent_activity():
    sql = """
        SELECT 
            b.booking_id,
            b.pickup_code,
            b.booking_date,
            b.status,
            b.total_amount,
            s.name as student_name,
            s.room_no,
            sl.slot_date,
            sl.start_time,
            sl.end_time
        FROM bookings b
        JOIN students s ON b.student_id = s.student_id
        JOIN slots sl ON b.slot_id = sl.slot_id
        ORDER BY b.booking_id DESC
        LIMIT 8;
    """
    return execute_query(sql)
