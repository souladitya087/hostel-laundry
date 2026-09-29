import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  ShoppingBag,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

export default function NewBookingModal({ isOpen, onClose, onBookingCreated, currentUser }) {
  const [step, setStep] = useState(1);
  const [students, setStudents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isPaidNow, setIsPaidNow] = useState(true);

  // Success State
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setSelectedStudentId('');
    setSelectedSlotId('');
    setItemQuantities({});
    setNotes('');
    setError('');
    setCreatedBooking(null);
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsData, slotsData, servicesData] = await Promise.all([
        api.getStudents(),
        api.getAvailableSlots(),
        api.getServices(false)
      ]);
      setStudents(studentsData);
      setSlots(slotsData);
      setServices(servicesData);

      // Default select first available slot and student if present
      if (currentUser?.role === 'student' && currentUser.student_id) {
        setSelectedStudentId(currentUser.student_id);
      } else if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].student_id);
      }
      if (slotsData.length > 0) setSelectedSlotId(slotsData[0].slot_id);

      // Default 1 quantity for first service (Wash & Fold)
      if (servicesData.length > 0) {
        setItemQuantities({ [servicesData[0].service_id]: 2 });
      }
    } catch (err) {
      setError('Failed to load booking form data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (serviceId, delta) => {
    setItemQuantities(prev => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  // Calculate live total
  const calculateTotal = () => {
    let sum = 0;
    services.forEach(srv => {
      const qty = itemQuantities[srv.service_id] || 0;
      sum += qty * Number(srv.unit_price);
    });
    return sum;
  };

  const totalAmount = calculateTotal();
  const totalItemsCount = Object.values(itemQuantities).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    if (!selectedSlotId) {
      setError('Please select an available collection slot.');
      return;
    }
    if (totalItemsCount === 0) {
      setError('Please select at least 1 laundry service / item quantity.');
      return;
    }

    setSubmitting(true);
    setError('');

    const itemsPayload = Object.entries(itemQuantities).map(([service_id, quantity]) => ({
      service_id: parseInt(service_id),
      quantity: parseInt(quantity)
    }));

    const payload = {
      student_id: parseInt(selectedStudentId),
      slot_id: parseInt(selectedSlotId),
      items: itemsPayload,
      notes: notes,
      payment: isPaidNow ? {
        paid_amount: totalAmount,
        payment_method: paymentMethod
      } : null
    };

    try {
      const result = await api.createBooking(payload);
      setCreatedBooking(result);
      if (onBookingCreated) onBookingCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-booking-box" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ShoppingBag size={20} className="text-primary" />
            <h3>Reserve Laundry Slot & Items</h3>
          </div>
          <button className="btn-ghost btn-sm close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading available slots and services...</p>
          </div>
        ) : createdBooking ? (
          /* Success Screen */
          <div className="booking-success-box">
            <div className="success-icon-wrap">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h4>Booking Confirmed!</h4>
            <p className="success-subtitle">Slot reserved and laundry ticket generated</p>

            <div className="pickup-token-display">
              <span className="token-small-label">PICKUP TOKEN</span>
              <span className="token-huge">{createdBooking.pickup_code}</span>
              <span className="token-amount">Total: ₹{Number(createdBooking.total_amount).toFixed(2)}</span>
            </div>

            <p className="token-instructions">
              Take clothes to the hostel laundry counter during your reserved time slot.
            </p>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  resetForm();
                  loadInitialData();
                }}
              >
                Book Another
              </button>
              <button 
                className="btn btn-primary" 
                onClick={onClose}
              >
                View in Orders List
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="booking-form">
            {/* Step 1: Select Student */}
            <div className="form-section">
              <label className="form-label">1. Student Details</label>
              {currentUser?.role === 'student' ? (
                <div className="locked-student-card">
                  <div className="locked-student-avatar">
                    <GraduationCap size={20} className="text-primary" />
                  </div>
                  <div className="locked-student-info">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.register_no} • Hostel Room {currentUser.room_no}</span>
                  </div>
                  <span className="badge badge-completed" style={{ marginLeft: 'auto' }}>Verified</span>
                </div>
              ) : (
                <select 
                  className="form-select"
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(std => (
                    <option key={std.student_id} value={std.student_id}>
                      {std.name} ({std.register_no}) - Room {std.room_no}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Select Slot with Capacity */}
            <div className="form-section">
              <label className="form-label">2. Select Collection Slot (Capacity-Validated)</label>
              {slots.length === 0 ? (
                <div className="empty-slots-warning">
                  No slots currently available. Please add new slots in Slot Schedules.
                </div>
              ) : (
                <div className="slots-grid-picker">
                  {slots.map(sl => {
                    const isSelected = parseInt(selectedSlotId) === sl.slot_id;
                    const seatsLeft = sl.available_capacity;
                    return (
                      <div 
                        key={sl.slot_id}
                        className={`slot-card-pick ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSlotId(sl.slot_id)}
                      >
                        <div className="slot-pick-date">{sl.slot_date}</div>
                        <div className="slot-pick-time">{sl.start_time} - {sl.end_time}</div>
                        <div className="slot-pick-capacity">
                          <span className={`capacity-dot ${seatsLeft <= 2 ? 'warning' : 'good'}`} />
                          <span>{seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Select Laundry Items */}
            <div className="form-section">
              <label className="form-label">3. Laundry Services & Quantities</label>
              <div className="services-picker-list">
                {services.map(srv => {
                  const qty = itemQuantities[srv.service_id] || 0;
                  return (
                    <div key={srv.service_id} className={`service-item-row ${qty > 0 ? 'active' : ''}`}>
                      <div className="srv-info">
                        <span className="srv-name">{srv.service_name}</span>
                        <span className="srv-meta">
                          ₹{Number(srv.unit_price).toFixed(0)} / piece • {srv.turnaround_days} day turnaround
                        </span>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          type="button" 
                          className="qty-btn" 
                          onClick={() => handleQuantityChange(srv.service_id, -1)}
                          disabled={qty === 0}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number">{qty}</span>
                        <button 
                          type="button" 
                          className="qty-btn" 
                          onClick={() => handleQuantityChange(srv.service_id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Notes & Payment */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Special Garment Notes</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. gentle cycle, color bleed caution"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Settlement</label>
                <select 
                  className="form-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI Instant (QR / App)</option>
                  <option value="Student ID Card">Student ID Smart Card</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>
            </div>

            {/* Total Footer */}
            <div className="booking-modal-summary">
              <div className="summary-left">
                <span className="summary-clothes">{totalItemsCount} total garments</span>
                <span className="summary-price">₹{totalAmount.toFixed(2)}</span>
              </div>

              <div className="summary-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || totalItemsCount === 0 || !selectedSlotId}
                >
                  {submitting ? 'Reserving...' : `Confirm Booking (₹${totalAmount.toFixed(0)})`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
