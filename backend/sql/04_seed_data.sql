-- ====================================================================
-- Campus Laundry Slot Booking and Billing System
-- Realistic Sample Seed Data for Demonstration & Evaluation
-- ====================================================================

USE campus_laundry_db;

-- 1. INSERT STUDENTS (12 realistic hostel students with college email and password)
INSERT INTO students (name, register_no, phone, email, password, room_no) VALUES
('Aditya Sharma', '2024CS01', '+91 98765 43210', 'aditya.cs24@campus.edu', 'student123', 'BH-204'),
('Priya Patel', '2024IT15', '+91 98765 43211', 'priya.it24@campus.edu', 'student123', 'GH-102'),
('Rohan Verma', '2023ME42', '+91 98765 43212', 'rohan.me23@campus.edu', 'student123', 'BH-315'),
('Sneha Kulkarni', '2024EC08', '+91 98765 43213', 'sneha.ec24@campus.edu', 'student123', 'GH-208'),
('Aman Gupta', '2023CS88', '+91 98765 43214', 'aman.cs23@campus.edu', 'student123', 'BH-112'),
('Ananya Iyer', '2024DS19', '+91 98765 43215', 'ananya.ds24@campus.edu', 'student123', 'GH-304'),
('Karthik Nair', '2023EE31', '+91 98765 43216', 'karthik.ee23@campus.edu', 'student123', 'BH-401'),
('Meera Joshi', '2024AI05', '+91 98765 43217', 'meera.ai24@campus.edu', 'student123', 'GH-115'),
('Varun Reddy', '2023CE22', '+91 98765 43218', 'varun.ce23@campus.edu', 'student123', 'BH-220'),
('Tanvi Deshmukh', '2024IT77', '+91 98765 43219', 'tanvi.it24@campus.edu', 'student123', 'GH-219'),
('Siddharth Rao', '2023CS50', '+91 98765 43220', 'sid.cs23@campus.edu', 'student123', 'BH-105'),
('Pooja Mehta', '2024EC33', '+91 98765 43221', 'pooja.ec24@campus.edu', 'student123', 'GH-312');

-- 2. INSERT SERVICES (10 diverse laundry services with pair / piece units)
INSERT INTO services (service_name, unit_price, turnaround_days, description, category, unit_type, is_active) VALUES
('Wash & Fold (Pair)', 30.00, 1, 'Standard machine washing, tumble drying, and neat folding', 'Everyday', 'pair', TRUE),
('Wash & Steam Iron (Pair)', 50.00, 2, 'Deep fabric wash followed by crisp vertical steam pressing', 'Everyday', 'pair', TRUE),
('Express Same-Day Wash (Pair)', 80.00, 0, 'Priority rush service washed, dried, and folded within 6 hours', 'Express', 'pair', TRUE),
('Dry Cleaning (Suits / Blazers)', 180.00, 3, 'Professional chemical dry cleaning for blazers, coats, and formalwear', 'Specialty', 'pair', TRUE),
('Heavy Bedding & Blankets', 120.00, 2, 'Large capacity thermal drum wash for comforters, quilts, and bedspreads', 'Heavy', 'piece', TRUE),
('Sneakers & Shoe Spa (Pair)', 150.00, 2, 'Deep dirt extraction, midsole brightening, and odor disinfection', 'Footwear', 'pair', TRUE),
('Steam Ironing Only (Pair)', 25.00, 1, 'Quick wrinkle removal and steam finish for trousers & shirts', 'Everyday', 'pair', TRUE),
('Curtains & Drapes Care', 140.00, 3, 'Dust and allergen extraction for hostel room curtains', 'Heavy', 'piece', TRUE),
('Traditional Ethnic Wear (Pair)', 130.00, 2, 'Delicate wash and precision fold for festive attire', 'Specialty', 'pair', TRUE),
('Bedsheets & Pillow Covers (Pair)', 60.00, 1, 'Sanitizing cycle with soft fabric conditioner', 'Everyday', 'pair', TRUE);

-- 3. INSERT SLOTS (Today and upcoming dates)
INSERT INTO slots (slot_date, start_time, end_time, capacity, status) VALUES
(CURDATE(), '08:00:00', '10:00:00', 8, 'Available'),
(CURDATE(), '11:00:00', '13:00:00', 10, 'Available'),
(CURDATE(), '14:00:00', '16:00:00', 10, 'Available'),
(CURDATE(), '17:00:00', '19:00:00', 8, 'Available'),
(CURDATE(), '19:30:00', '21:30:00', 6, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '10:00:00', 10, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '13:00:00', 10, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 10, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', '19:00:00', 8, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '12:00:00', 12, 'Available'),
(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00', '17:00:00', 12, 'Available');

-- 4. INSERT SAMPLE BOOKINGS (12 realistic bookings)
INSERT INTO bookings (student_id, slot_id, booking_date, status, total_amount, pickup_code, notes) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'In Progress', 210.00, 'LND-2401', 'Please separate white shirts'),
(2, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Ready for Pickup', 180.00, 'LND-2402', 'Hostel formal event blazer'),
(3, 1, NOW(), 'Pending', 90.00, 'LND-2403', 'Standard wash'),
(4, 3, NOW(), 'Completed', 150.00, 'LND-2404', 'Sports shoes cleaning'),
(5, 4, NOW(), 'Pending', 240.00, 'LND-2405', 'Two heavy winter blankets'),
(6, 2, NOW(), 'In Progress', 100.00, 'LND-2406', 'Two pairs wash and steam iron'),
(7, 5, NOW(), 'Completed', 180.00, 'LND-2407', 'Blazer dry clean'),
(8, 6, NOW(), 'Ready for Pickup', 80.00, 'LND-2408', 'Express same-day wash'),
(9, 7, NOW(), 'Pending', 50.00, 'LND-2409', 'Wash & steam iron'),
(10, 8, NOW(), 'Completed', 210.00, 'LND-2410', 'Suits and shoes'),
(11, 9, NOW(), 'In Progress', 150.00, 'LND-2411', 'Sneakers care'),
(12, 10, NOW(), 'Cancelled', 60.00, 'LND-2412', 'Cancelled by resident');

-- 5. INSERT BOOKING ITEMS (18 line items across bookings)
INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, line_total) VALUES
-- Booking 1 items
(1, 1, 3, 30.00, 90.00),
(1, 5, 1, 120.00, 120.00),
-- Booking 2 items
(2, 4, 1, 180.00, 180.00),
-- Booking 3 items
(3, 1, 3, 30.00, 90.00),
-- Booking 4 items
(4, 6, 1, 150.00, 150.00),
-- Booking 5 items
(5, 5, 2, 120.00, 240.00),
-- Booking 6 items
(6, 2, 2, 50.00, 100.00),
-- Booking 7 items
(7, 4, 1, 180.00, 180.00),
-- Booking 8 items
(8, 3, 1, 80.00, 80.00),
-- Booking 9 items
(9, 2, 1, 50.00, 50.00),
-- Booking 10 items
(10, 1, 2, 30.00, 60.00),
(10, 6, 1, 150.00, 150.00),
-- Booking 11 items
(11, 6, 1, 150.00, 150.00),
-- Booking 12 items
(12, 10, 1, 60.00, 60.00);

-- 6. INSERT PAYMENTS (10 payment records)
INSERT INTO payments (booking_id, paid_amount, payment_method, payment_status, transaction_ref) VALUES
(1, 210.00, 'UPI', 'Paid', 'UPI/2026/99812'),
(2, 180.00, 'Student ID Card', 'Paid', 'CARD-88123'),
(4, 150.00, 'UPI', 'Paid', 'UPI/2026/77412'),
(5, 240.00, 'Cash', 'Paid', 'CASH-REC-045'),
(6, 100.00, 'UPI', 'Paid', 'UPI/2026/33101'),
(7, 180.00, 'Student ID Card', 'Paid', 'CARD-88190'),
(8, 80.00, 'UPI', 'Paid', 'UPI/2026/44512'),
(9, 50.00, 'Cash', 'Paid', 'CASH-REC-049'),
(10, 210.00, 'UPI', 'Paid', 'UPI/2026/55678'),
(11, 150.00, 'Student ID Card', 'Paid', 'CARD-99021');
