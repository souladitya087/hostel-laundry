-- ====================================================================
-- Campus Laundry Slot Booking and Billing System
-- Stored Procedures & Triggers for Automation & Business Integrity
-- ====================================================================

USE campus_laundry_db;

DELIMITER $$

-- ====================================================================
-- STORED PROCEDURE 1: sp_create_booking
-- Atomically reserves a slot after verifying that the slot capacity is not exceeded.
-- Sets OUT parameters for created booking_id and status message.
-- ====================================================================
DROP PROCEDURE IF EXISTS sp_create_booking$$
CREATE PROCEDURE sp_create_booking(
    IN p_student_id INT,
    IN p_slot_id INT,
    IN p_pickup_code VARCHAR(20),
    IN p_notes TEXT,
    OUT p_booking_id INT,
    OUT p_status_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_slot_exists INT DEFAULT 0;
    DECLARE v_capacity INT DEFAULT 0;
    DECLARE v_current_booked INT DEFAULT 0;
    DECLARE v_slot_status VARCHAR(20);

    -- 1. Check if student exists
    IF (SELECT COUNT(*) FROM students WHERE student_id = p_student_id) = 0 THEN
        SET p_booking_id = NULL;
        SET p_status_message = 'ERROR: Student ID not found.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student ID does not exist.';
        LEAVE proc_label;
    END IF;

    -- 2. Check if slot exists and fetch capacity
    SELECT COUNT(*), COALESCE(MAX(capacity), 0), COALESCE(MAX(status), 'Available')
    INTO v_slot_exists, v_capacity, v_slot_status
    FROM slots 
    WHERE slot_id = p_slot_id;

    IF v_slot_exists = 0 THEN
        SET p_booking_id = NULL;
        SET p_status_message = 'ERROR: Slot ID not found.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot ID does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_slot_status = 'Maintenance' THEN
        SET p_booking_id = NULL;
        SET p_status_message = 'ERROR: Selected slot is under maintenance.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot is under maintenance.';
        LEAVE proc_label;
    END IF;

    -- 3. Calculate current active bookings for this slot
    SELECT COUNT(*) INTO v_current_booked 
    FROM bookings 
    WHERE slot_id = p_slot_id AND status != 'Cancelled';

    -- 4. Check slot capacity constraint
    IF v_current_booked >= v_capacity THEN
        -- Mark slot as Full
        UPDATE slots SET status = 'Full' WHERE slot_id = p_slot_id;
        SET p_booking_id = NULL;
        SET p_status_message = 'ERROR: Slot is fully booked for this time interval.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot capacity reached. Booking rejected.';
        LEAVE proc_label;
    END IF;

    -- 5. Insert new booking record
    INSERT INTO bookings (student_id, slot_id, status, total_amount, pickup_code, notes)
    VALUES (p_student_id, p_slot_id, 'Pending', 0.00, p_pickup_code, p_notes);

    SET p_booking_id = LAST_INSERT_ID();
    SET p_status_message = 'SUCCESS: Booking slot confirmed.';

    -- 6. Update slot status if full
    IF (v_current_booked + 1) >= v_capacity THEN
        UPDATE slots SET status = 'Full' WHERE slot_id = p_slot_id;
    END IF;

END proc_label$$

-- ====================================================================
-- STORED PROCEDURE 2: sp_complete_booking_payment
-- Records payment and updates booking status
-- ====================================================================
DROP PROCEDURE IF EXISTS sp_complete_booking_payment$$
CREATE PROCEDURE sp_complete_booking_payment(
    IN p_booking_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_method VARCHAR(50),
    IN p_tx_ref VARCHAR(100),
    OUT p_payment_id INT,
    OUT p_status_msg VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM bookings WHERE booking_id = p_booking_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found.';
    END IF;

    INSERT INTO payments (booking_id, paid_amount, payment_method, payment_status, transaction_ref)
    VALUES (p_booking_id, p_amount, p_method, 'Paid', p_tx_ref);

    SET p_payment_id = LAST_INSERT_ID();
    SET p_status_msg = 'Payment successfully recorded.';
END$$

-- ====================================================================
-- TRIGGERS: Automatically recalculate bookings.total_amount
-- whenever items are added, modified, or removed from booking_items
-- ====================================================================

-- TRIGGER 1: After inserting an item
DROP TRIGGER IF EXISTS trg_after_booking_items_insert$$
CREATE TRIGGER trg_after_booking_items_insert
AFTER INSERT ON booking_items
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET total_amount = (
        SELECT COALESCE(SUM(line_total), 0.00)
        FROM booking_items
        WHERE booking_id = NEW.booking_id
    )
    WHERE booking_id = NEW.booking_id;
END$$

-- TRIGGER 2: After updating an item
DROP TRIGGER IF EXISTS trg_after_booking_items_update$$
CREATE TRIGGER trg_after_booking_items_update
AFTER UPDATE ON booking_items
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET total_amount = (
        SELECT COALESCE(SUM(line_total), 0.00)
        FROM booking_items
        WHERE booking_id = NEW.booking_id
    )
    WHERE booking_id = NEW.booking_id;
END$$

-- TRIGGER 3: After deleting an item
DROP TRIGGER IF EXISTS trg_after_booking_items_delete$$
CREATE TRIGGER trg_after_booking_items_delete
AFTER DELETE ON booking_items
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET total_amount = (
        SELECT COALESCE(SUM(line_total), 0.00)
        FROM booking_items
        WHERE booking_id = OLD.booking_id
    )
    WHERE booking_id = OLD.booking_id;
END$$

DELIMITER ;
