import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  User, 
  Calendar, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export default function ReceiptModal({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const payment = booking.payment || (booking.payments && booking.payments[0]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content receipt-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="receipt-badge-title">
            <FileCheck size={18} className="text-primary" />
            <h3>Official Laundry Receipt</h3>
          </div>
          <button className="btn-ghost btn-sm close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="receipt-paper" id="printable-receipt">
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-brand">CAMPUS LAUNDRY SERVICES</div>
            <div className="receipt-subtitle">Hostel Slot Booking & Billing Management</div>
            <div className="receipt-divider" />
          </div>

          {/* Token Card */}
          <div className="receipt-token-card">
            <div className="token-left">
              <span className="token-label">PICKUP TOKEN CODE</span>
              <span className="token-code">{booking.pickup_code}</span>
              <span className="token-hint">Present this code at the laundry counter</span>
            </div>
            <div className="token-qr">
              <QrCode size={56} className="qr-graphic" />
            </div>
          </div>

          {/* Info Grid */}
          <div className="receipt-grid">
            <div className="receipt-grid-item">
              <span className="grid-label">STUDENT NAME</span>
              <span className="grid-val">{booking.student_name || 'N/A'}</span>
            </div>
            <div className="receipt-grid-item">
              <span className="grid-label">REGISTER NUMBER</span>
              <span className="grid-val">{booking.register_no || 'N/A'}</span>
            </div>
            <div className="receipt-grid-item">
              <span className="grid-label">HOSTEL ROOM</span>
              <span className="grid-val">{booking.room_no || 'N/A'}</span>
            </div>
            <div className="receipt-grid-item">
              <span className="grid-label">PHONE</span>
              <span className="grid-val">{booking.student_phone || 'N/A'}</span>
            </div>
            <div className="receipt-grid-item">
              <span className="grid-label">SLOT DATE</span>
              <span className="grid-val">{booking.slot_date || 'N/A'}</span>
            </div>
            <div className="receipt-grid-item">
              <span className="grid-label">SLOT TIME</span>
              <span className="grid-val">{booking.start_time} - {booking.end_time}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="receipt-items-section">
            <div className="receipt-section-heading">ITEMIZED SERVICES</div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {booking.items && booking.items.length > 0 ? (
                  booking.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.service_name}</strong>
                        {item.turnaround_days !== undefined && (
                          <span className="item-turnaround"> ({item.turnaround_days}d ready)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '10px' }}>
                      Standard Laundry Service Bundle
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Summary */}
          <div className="receipt-summary-box">
            <div className="summary-row grand-total">
              <span>Grand Total</span>
              <span>₹{Number(booking.total_amount).toFixed(2)}</span>
            </div>
            <div className="summary-row payment-status-row">
              <span>Payment Status:</span>
              <span className="status-highlight">
                <CheckCircle2 size={14} />
                {payment ? `${payment.payment_status} (${payment.payment_method})` : 'Settled at Counter'}
              </span>
            </div>
            {payment && payment.transaction_ref && (
              <div className="summary-row tx-row">
                <span>Ref Number:</span>
                <span>{payment.transaction_ref}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="receipt-footer">
            <p>Clothes will be held at the hostel counter for up to 3 days after completion.</p>
            <p className="timestamp">Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
