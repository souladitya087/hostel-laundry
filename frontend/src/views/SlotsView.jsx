import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  X,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function SlotsView({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    slot_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '12:00',
    capacity: 10
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await api.getSlots();
      setSlots(data);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createSlot({
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      setIsModalOpen(false);
      await loadSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await api.deleteSlot(slotId);
      await loadSlots();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>{isAdmin ? 'Collection & Drop-Off Slot Schedules' : 'Available Collection Slot Schedules'}</h2>
          <p className="view-header-desc">
            {isAdmin 
              ? 'Control daily operational hours, machine loads, and student intake limits' 
              : 'Browse scheduled collection windows and live remaining capacity before dropping clothes'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Slot</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="info-banner glass-panel">
          <Info size={18} className="text-primary" />
          <span>Each time slot has a strict capacity limit enforced by the DBMS to prevent counter overcrowding. Select an available slot when creating your booking.</span>
        </div>
      )}

      {loading ? (
        <div className="table-loading-state">
          <div className="spinner" />
          <p>Loading slots schedule...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="empty-notice glass-panel" style={{ padding: '40px' }}>
          No slots created yet. {isAdmin ? 'Click "Add New Slot" to create the first time interval.' : 'Please check back later for upcoming slots.'}
        </div>
      ) : (
        <div className="slots-cards-grid">
          {slots.map(s => {
            const percent = Math.min(s.occupancy_percent || 0, 100);
            const isFull = s.available_capacity <= 0 || s.slot_status === 'Full';
            return (
              <div key={s.slot_id} className="slot-mgmt-card glass-panel">
                <div className="slot-card-top">
                  <div className="slot-date-badge">
                    <Calendar size={14} />
                    <span>{s.slot_date}</span>
                  </div>
                  <div>
                    {isFull ? (
                      <span className="badge badge-cancelled">FULL</span>
                    ) : (
                      <span className="badge badge-completed">AVAILABLE</span>
                    )}
                  </div>
                </div>

                <div className="slot-time-hero">
                  <Clock size={20} className="text-primary" />
                  <h3>{s.start_time} - {s.end_time}</h3>
                </div>

                {/* Capacity Progress Bar */}
                <div className="slot-progress-block">
                  <div className="progress-labels">
                    <span>Booked: {s.booked_count} / {s.capacity}</span>
                    <span className="available-num">{s.available_capacity} left</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className={`progress-bar-fill ${percent >= 100 ? 'fill-red' : percent >= 70 ? 'fill-amber' : 'fill-blue'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="slot-card-actions">
                  <span className="slot-id-label">Slot #{s.slot_id}</span>
                  {isAdmin && (
                    <button 
                      className="btn btn-ghost btn-sm text-danger" 
                      onClick={() => handleDeleteSlot(s.slot_id)}
                      title="Delete Slot"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal (Admin only) */}
      {isAdmin && isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Collection Time Slot</h3>
              <button className="btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleCreateSlot} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Slot Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.slot_date}
                  onChange={e => setFormData({ ...formData, slot_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max Student Capacity (Seats)</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  className="form-input" 
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                  The stored procedure `sp_create_booking` will reject bookings once this capacity is reached.
                </small>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
