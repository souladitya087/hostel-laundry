-- ====================================================================
-- Campus Laundry Slot Booking and Billing System
-- DBMS Views for Reporting, Aggregations, and Summary Queries
-- ====================================================================

USE campus_laundry_db;

-- 1. BOOKING SUMMARY VIEW
-- Consolidates student info, slot timing, booking items count, total clothes, and payment status
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
GROUP BY 
    b.booking_id, b.pickup_code, b.booking_date, b.status, b.total_amount,
    s.student_id, s.name, s.register_no, s.phone, s.room_no,
    sl.slot_id, sl.slot_date, sl.start_time, sl.end_time,
    p.payment_status, p.payment_method, p.paid_amount;

-- 2. SLOT UTILIZATION VIEW
-- Computes real-time capacity, booked slots, remaining slots, and percentage occupancy
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
    ROUND((COUNT(b.booking_id) / sl.capacity) * 100, 1) AS occupancy_percent
FROM slots sl
LEFT JOIN bookings b ON sl.slot_id = b.slot_id AND b.status != 'Cancelled'
GROUP BY sl.slot_id, sl.slot_date, sl.start_time, sl.end_time, sl.capacity, sl.status;

-- 3. SERVICE REVENUE & ANALYTICS VIEW
-- Analyzes sales and volume by service category
DROP VIEW IF EXISTS vw_service_analytics;
CREATE VIEW vw_service_analytics AS
SELECT 
    srv.service_id,
    srv.service_name,
    srv.unit_price,
    COUNT(bi.item_id) AS total_orders_placed,
    COALESCE(SUM(bi.quantity), 0) AS total_units_cleaned,
    COALESCE(SUM(bi.line_total), 0.00) AS total_revenue_generated
FROM services srv
LEFT JOIN booking_items bi ON srv.service_id = bi.service_id
LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status != 'Cancelled'
GROUP BY srv.service_id, srv.service_name, srv.unit_price;

-- 4. DAILY FINANCIAL SUMMARY VIEW
-- Daily aggregated revenue and booking performance
DROP VIEW IF EXISTS vw_daily_financial_summary;
CREATE VIEW vw_daily_financial_summary AS
SELECT 
    DATE(b.booking_date) AS summary_date,
    COUNT(b.booking_id) AS total_bookings,
    SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) AS completed_bookings,
    SUM(CASE WHEN b.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
    COALESCE(SUM(b.total_amount), 0.00) AS gross_billed_amount,
    COALESCE(SUM(p.paid_amount), 0.00) AS total_collected_revenue
FROM bookings b
LEFT JOIN payments p ON b.booking_id = p.booking_id AND p.payment_status = 'Paid'
GROUP BY DATE(b.booking_date)
ORDER BY summary_date DESC;
