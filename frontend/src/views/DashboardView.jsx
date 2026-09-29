import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Shirt, 
  PieChart, 
  ArrowUpRight, 
  Clock, 
  Plus, 
  ChevronRight,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ onOpenNewBooking, onViewReceipt, onNavigateTab }) {
  const [kpis, setKpis] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [slotUtilization, setSlotUtilization] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisData, recentData, slotsData] = await Promise.all([
        api.getKpis(),
        api.getRecentActivity(),
        api.getSlotUtilization()
      ]);
      setKpis(kpisData);
      setRecentBookings(recentData);
      setSlotUtilization(slotsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Ready for Pickup': return <span className="badge badge-ready">Ready for Pickup</span>;
      case 'Completed': return <span className="badge badge-completed">Completed</span>;
      case 'Cancelled': return <span className="badge badge-cancelled">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div className="banner-left">
          <div className="welcome-pill">
            <Sparkles size={14} className="text-primary" />
            <span>Campus Laundry Operations Center</span>
          </div>
          <h2>Hostel Laundry Slot Booking & Billing</h2>
          <p>Real-time slot capacity monitoring, 3NF relational data integrity, and automated bill calculations.</p>
        </div>
        <div className="banner-actions">
          <button className="btn btn-primary" onClick={onOpenNewBooking}>
            <Plus size={16} />
            <span>Book Laundry Slot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-blue">
            <CalendarCheck size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Active Laundry Orders</span>
            <span className="kpi-value">{kpis ? kpis.active_bookings : '--'}</span>
            <span className="kpi-hint">Pending / In Progress</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-green">
            <DollarSign size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Revenue Collected</span>
            <span className="kpi-value">₹{kpis ? Number(kpis.total_revenue).toFixed(2) : '--'}</span>
            <span className="kpi-hint">Via UPI, ID Card, Cash</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-purple">
            <Shirt size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Clothes Cleaned</span>
            <span className="kpi-value">{kpis ? kpis.total_clothes_washed : '--'}</span>
            <span className="kpi-hint">Across all bookings</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-amber">
            <PieChart size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Slot Occupancy</span>
            <span className="kpi-value">{kpis ? `${kpis.slot_occupancy_rate}%` : '--'}</span>
            <span className="kpi-hint">Total capacity utilization</span>
          </div>
        </div>
      </div>

      {/* Dashboard Dual Grid: Recent Bookings & Slot Capacity */}
      <div className="dashboard-grid-2">
        {/* Recent Orders Timeline */}
        <div className="dashboard-card glass-panel">
          <div className="card-header-row">
            <div>
              <h3>Recent Laundry Bookings</h3>
              <p className="card-subtitle">Live orders with unique pickup tokens</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('bookings')}>
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="orders-list">
            {recentBookings.length === 0 ? (
              <div className="empty-notice">No bookings recorded yet.</div>
            ) : (
              recentBookings.map((b) => (
                <div key={b.booking_id} className="order-item-row">
                  <div className="order-token">
                    <span className="token-code-pill">{b.pickup_code}</span>
                    <span className="order-time">{b.slot_date} ({b.start_time})</span>
                  </div>
                  <div className="order-student-info">
                    <strong>{b.student_name}</strong>
                    <span>Room: {b.room_no}</span>
                  </div>
                  <div className="order-meta">
                    <span className="order-amount">₹{Number(b.total_amount).toFixed(2)}</span>
                    {getStatusBadge(b.status)}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => onViewReceipt(b.booking_id)}
                    title="View & Print Official Receipt"
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slot Capacity & Utilization */}
        <div className="dashboard-card glass-panel">
          <div className="card-header-row">
            <div>
              <h3>Slot Capacity & Schedule</h3>
              <p className="card-subtitle">Capacity limits enforced via Stored Procedure</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('slots')}>
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="slot-capacity-list">
            {slotUtilization.length === 0 ? (
              <div className="empty-notice">No slot data available.</div>
            ) : (
              slotUtilization.map((s) => {
                const percent = Math.min(s.occupancy_pct || 0, 100);
                const isFull = s.available_seats <= 0 || s.slot_status === 'Full';
                return (
                  <div key={s.slot_id} className="slot-cap-item">
                    <div className="slot-cap-header">
                      <div>
                        <strong>{s.slot_date}</strong>
                        <span className="slot-time-range">{s.start_time} - {s.end_time}</span>
                      </div>
                      <div className="slot-seats-badge">
                        {isFull ? (
                          <span className="badge badge-cancelled">FULL</span>
                        ) : (
                          <span className="badge badge-progress">{s.available_seats} seats left</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar-track">
                      <div 
                        className={`progress-bar-fill ${percent >= 90 ? 'fill-red' : percent >= 60 ? 'fill-amber' : 'fill-blue'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="slot-cap-footer">
                      <span>{s.booked_count} of {s.capacity} slots booked</span>
                      <span>{percent}% full</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
