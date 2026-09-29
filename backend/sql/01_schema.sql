-- ====================================================================
-- Campus Laundry Slot Booking and Billing System
-- DBMS Mini Project - 3NF Relational Database Schema (MySQL 8.0)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS campus_laundry_db;
USE campus_laundry_db;

-- 1. STUDENTS TABLE
-- Stores profile details for hostel students
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_items;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    register_no VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. SERVICES TABLE
-- Laundry services, pricing, and turnaround timeframe
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    turnaround_days INT NOT NULL DEFAULT 1 CHECK (turnaround_days >= 0),
    description VARCHAR(255),
    category VARCHAR(50) DEFAULT 'General',
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 3. SLOTS TABLE
-- Booking slots for laundry submission and collection
CREATE TABLE slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 10 CHECK (capacity > 0),
    status ENUM('Available', 'Full', 'Maintenance') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_slot_interval UNIQUE (slot_date, start_time, end_time)
) ENGINE=InnoDB;

-- 4. BOOKINGS TABLE
-- Core transaction records linking student, slot, and status
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    slot_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled') DEFAULT 'Pending',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    pickup_code VARCHAR(20) NOT NULL UNIQUE,
    notes TEXT,
    CONSTRAINT fk_booking_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id) 
        REFERENCES slots(slot_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. BOOKING_ITEMS TABLE
-- Line items for each booking specifying service and quantity
CREATE TABLE booking_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
    CONSTRAINT fk_item_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_service FOREIGN KEY (service_id) 
        REFERENCES services(service_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. PAYMENTS TABLE
-- Payment transactions and verification
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL CHECK (paid_amount > 0),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('Cash', 'UPI', 'Student ID Card', 'Online') NOT NULL DEFAULT 'UPI',
    payment_status ENUM('Paid', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Paid',
    transaction_ref VARCHAR(100),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Create indexes for frequent search & join optimizations
CREATE INDEX idx_student_register ON students(register_no);
CREATE INDEX idx_booking_student ON bookings(student_id);
CREATE INDEX idx_booking_slot ON bookings(slot_id);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_slot_date ON slots(slot_date);
