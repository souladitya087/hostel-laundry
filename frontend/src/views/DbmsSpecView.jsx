import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle, 
  Code, 
  Zap, 
  Table, 
  Layers, 
  ShieldCheck, 
  Eye, 
  Copy,
  Check
} from 'lucide-react';

export default function DbmsSpecView() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const tables = [
    { name: 'students', pk: 'student_id', purpose: 'Hostel student profiles & registration identifiers', cols: 'student_id (PK), name, register_no (UQ), phone, email, room_no, created_at' },
    { name: 'services', pk: 'service_id', purpose: 'Laundry service catalog, rates, and turnaround timeframe', cols: 'service_id (PK), service_name (UQ), unit_price, turnaround_days, description, category, is_active' },
    { name: 'slots', pk: 'slot_id', purpose: 'Collection intervals with strict capacity enforcement', cols: 'slot_id (PK), slot_date, start_time, end_time, capacity, status, created_at, UQ(date, times)' },
    { name: 'bookings', pk: 'booking_id', purpose: 'Core booking transaction with student & slot foreign keys', cols: 'booking_id (PK), student_id (FK), slot_id (FK), booking_date, status, total_amount, pickup_code (UQ), notes' },
    { name: 'booking_items', pk: 'item_id', purpose: 'Line items linking service and quantity to a booking', cols: 'item_id (PK), booking_id (FK), service_id (FK), quantity (CHK > 0), unit_price, line_total' },
    { name: 'payments', pk: 'payment_id', purpose: 'Payment settlement records and transaction verification', cols: 'payment_id (PK), booking_id (FK), paid_amount, payment_date, payment_method, payment_status, transaction_ref' },
  ];

  const spCode = `-- STORED PROCEDURE: sp_create_booking
-- Atomically checks slot capacity and creates booking
DELIMITER $$
CREATE PROCEDURE sp_create_booking(
    IN p_student_id INT,
    IN p_slot_id INT,
    IN p_pickup_code VARCHAR(20),
    IN p_notes TEXT,
    OUT p_booking_id INT,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    DECLARE v_capacity INT DEFAULT 0;
    DECLARE v_current_booked INT DEFAULT 0;

    -- Check remaining capacity
    SELECT capacity INTO v_capacity FROM slots WHERE slot_id = p_slot_id;
    SELECT COUNT(*) INTO v_current_booked FROM bookings WHERE slot_id = p_slot_id AND status != 'Cancelled';

    IF v_current_booked >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot capacity reached. Booking rejected.';
    ELSE
        INSERT INTO bookings (student_id, slot_id, status, total_amount, pickup_code, notes)
        VALUES (p_student_id, p_slot_id, 'Pending', 0.00, p_pickup_code, p_notes);
        SET p_booking_id = LAST_INSERT_ID();
        SET p_status_message = 'SUCCESS: Booking slot confirmed.';
    END IF;
END$$
DELIMITER ;`;

  const triggerCode = `-- TRIGGER: trg_after_booking_items_insert
-- Automatically recalculates bookings.total_amount
DELIMITER $$
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
DELIMITER ;`;

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>DBMS Project Specification & Relational Schema</h2>
          <p className="view-header-desc">Academic documentation for presentation, viva defense, and database evaluation</p>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="dbms-cards-grid">
        <div className="compliance-card glass-panel">
          <div className="compliance-header">
            <ShieldCheck size={20} className="text-success" />
            <h3>Academic DBMS Requirements Checklist</h3>
          </div>
          <div className="compliance-items">
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>6 Normalized Relational Tables</strong> connected with Primary and Foreign Keys</span></div>
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>Third Normal Form (3NF)</strong>: Zero repeating groups, partial dependencies, or transitive anomalies</span></div>
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>Integrity Constraints</strong>: PK, FK (ON UPDATE CASCADE/RESTRICT), UNIQUE register_no, CHECK quantity &gt; 0</span></div>
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>Stored Procedure</strong>: <code>sp_create_booking</code> with capacity overflow validation</span></div>
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>SQL Triggers</strong>: Automated recalculation of <code>bookings.total_amount</code> on insert/update/delete</span></div>
            <div className="comp-item"><CheckCircle size={16} className="text-success" /> <span><strong>Analytical Views</strong>: <code>vw_booking_summary</code>, <code>vw_slot_utilization</code>, <code>vw_daily_financial_summary</code></span></div>
          </div>
        </div>

        {/* 6 Tables Table */}
        <div className="compliance-card glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="compliance-header">
            <Table size={20} className="text-primary" />
            <h3>Relational Schema Entities (3NF)</h3>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Primary Key</th>
                  <th>Purpose</th>
                  <th>Key Columns & Constraints</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, idx) => (
                  <tr key={idx}>
                    <td><strong className="text-primary">{t.name}</strong></td>
                    <td><code>{t.pk}</code></td>
                    <td>{t.purpose}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.cols}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SQL Code Blocks */}
        <div className="code-box-card glass-panel">
          <div className="code-box-header">
            <div className="code-title">
              <Zap size={18} className="text-amber" />
              <h4>Stored Procedure: sp_create_booking</h4>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => copyToClipboard(spCode, 'sp')}
            >
              {copiedSection === 'sp' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copiedSection === 'sp' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="code-snippet"><code>{spCode}</code></pre>
        </div>

        <div className="code-box-card glass-panel">
          <div className="code-box-header">
            <div className="code-title">
              <Code size={18} className="text-primary" />
              <h4>Trigger: trg_after_booking_items_insert</h4>
            </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => copyToClipboard(triggerCode, 'trg')}
            >
              {copiedSection === 'trg' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copiedSection === 'trg' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="code-snippet"><code>{triggerCode}</code></pre>
        </div>
      </div>
    </div>
  );
}
