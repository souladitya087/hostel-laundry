import React, { useEffect, useState } from 'react';
import { 
  CalendarCheck, 
  DollarSign, 
  Shirt, 
  PieChart, 
  Plus, 
  ChevronRight, 
  ExternalLink, 
  Sparkles,
  GraduationCap,
  PackageCheck,
  FileText,
  Check,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ currentUser, onOpenNewBooking, onViewReceipt, onNavigateTab }) {
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const [kpis, setKpis] = useState(null);
  const [allStudentBookings, setAllStudentBookings] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [slotUtilization, setSlotUtilization] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [kpisData, recentData, slotsData] = await Promise.all([
          api.getKpis(),
          api.getRecentActivity(),
          api.getSlotUtilization()
        ]);
        setKpis(kpisData);
        setRecentBookings(recentData);
        setSlotUtilization(slotsData.slice(0, 5));
      } else if (isStudent && currentUser?.student_id) {
        const studentBookings = await api.getBookings({ student_id: currentUser.student_id });

        setAllStudentBookings(studentBookings);

        // Find primary active order:
        // 1. Ongoing order (Pending, In Progress, Ready for Pickup)
        // 2. If no ongoing order, show latest completed or cancelled order so student can see their order status & receipt
        // 3. Null if student has zero bookings
        const ongoingOrders = studentBookings.filter(b => 
          ['Pending', 'In Progress', 'Ready for Pickup'].includes(b.booking_status || b.status)
        );
        const primaryOrder = ongoingOrders.length > 0 
          ? ongoingOrders[0] 
          : (studentBookings.length > 0 ? studentBookings[0] : null);

        setActiveOrder(primaryOrder);
        setRecentBookings(studentBookings.slice(0, 5));
      }
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

  const getStepStatus = (orderStatus, stepIndex) => {
    // 0: Pending, 1: In Progress, 2: Ready for Pickup, 3: Completed
    if (orderStatus === 'Completed') return 'completed';
    const statusMap = {
      'Pending': 0,
      'In Progress': 1,
      'Ready for Pickup': 2,
      'Completed': 3
    };
    const current = statusMap[orderStatus] ?? -1;
    if (current > stepIndex) return 'completed';
    if (current === stepIndex) return 'current';
    return '';
  };

  const getStepProgressPercent = (orderStatus) => {
    switch (orderStatus) {
      case 'Pending': return 15;
      case 'In Progress': return 50;
      case 'Ready for Pickup': return 85;
      case 'Completed': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="table-loading-state" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading laundry dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Ready for Pickup Alert for Students */}
      {isStudent && activeOrder && (activeOrder.booking_status === 'Ready for Pickup' || activeOrder.status === 'Ready for Pickup') && (
        <div className="pickup-banner-alert glass-panel">
          <div className="pickup-alert-left">
            <PackageCheck size={28} className="text-success" />
            <div>
              <strong>Order Ready for Collection!</strong>
              <p>Your laundry is washed, pressed, and ready at the counter. Token: <span className="token-code-pill">{activeOrder.pickup_code}</span></p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onViewReceipt(activeOrder.booking_id)}>
            <FileText size={14} />
            <span>View Receipt</span>
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div className="banner-left">
          <div className="welcome-pill">
            {isAdmin ? (
              <>
                <Sparkles size={14} className="text-primary" />
                <span>Hostel Laundry Operations Center</span>
              </>
            ) : (
              <>
                <GraduationCap size={14} className="text-primary" />
                <span>Student Wardrobe Portal</span>
              </>
            )}
          </div>
          <h2>
            {isAdmin 
              ? 'Campus Laundry Operations & Management'
              : `Welcome back, ${currentUser?.name || 'Student'}!`}
          </h2>
          <p>
            {isAdmin 
              ? 'Real-time slot capacity monitoring, 3NF relational data integrity, and automated bill calculations.'
              : `Hostel Room: ${currentUser?.room_no || '--'} • Email: ${currentUser?.email || '--'} • Roll No: ${currentUser?.register_no || '--'}`}
          </p>
        </div>
        <div className="banner-actions">
          <button className="btn btn-primary" onClick={onOpenNewBooking}>
            <Plus size={16} />
            <span>{isAdmin ? 'New Booking' : 'Book Laundry Slot'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STUDENT-SPECIFIC VIEW: FOCUSED ACTIVE ORDER & LAUNDRY ITEMS */}
      {/* ============================================================== */}
      {isStudent && (
        <>
          {activeOrder ? (
            /* Active Laundry Order Card with Visual Tracker & Pair Breakdown */
            <div className="student-active-card">
              <div className="active-card-top">
                <div className="active-token-header">
                  <span className="active-token-badge">{activeOrder.pickup_code}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#fff' }}>
                      {['Pending', 'In Progress', 'Ready for Pickup'].includes(activeOrder.booking_status || activeOrder.status) 
                        ? 'Active Laundry Order' 
                        : `${activeOrder.booking_status || activeOrder.status} Laundry Order`} #{activeOrder.booking_id}
                    </strong>
                    <span className="active-order-date">Reserved: {activeOrder.slot_date} ({activeOrder.start_time} - {activeOrder.end_time})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getStatusBadge(activeOrder.booking_status || activeOrder.status)}
                </div>
              </div>

              {/* Order Switcher Chips when student has multiple bookings */}
              {allStudentBookings.length > 1 && (
                <div className="order-selector-chips">
                  <span className="order-selector-label">My Orders:</span>
                  <div className="order-chips-list">
                    {allStudentBookings.map((b) => {
                      const isSelected = activeOrder.booking_id === b.booking_id;
                      const bStatus = b.booking_status || b.status;
                      return (
                        <button
                          key={b.booking_id}
                          type="button"
                          className={`order-chip-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveOrder(b)}
                        >
                          <span className="chip-token">{b.pickup_code}</span>
                          <span className="chip-status-text">({bStatus})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Visual Status Indicator: Stepper for active/completed, Banner for cancelled */}
              {(activeOrder.booking_status || activeOrder.status) === 'Cancelled' ? (
                <div className="cancelled-order-banner">
                  <XCircle size={22} className="text-danger" />
                  <div>
                    <strong>Order Cancelled</strong>
                    <p>This laundry booking was cancelled. No clothes were washed and no charges will apply.</p>
                  </div>
                </div>
              ) : (
                <div className="order-stepper">
                  <div className="stepper-track-bg">
                    <div 
                      className="stepper-track-fill" 
                      style={{ width: `${getStepProgressPercent(activeOrder.booking_status || activeOrder.status)}%` }}
                    />
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 0)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 0) === 'completed' ? <Check size={18} /> : 1}
                    </div>
                    <span className="step-label">Submitted</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 1)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 1) === 'completed' ? <Check size={18} /> : 2}
                    </div>
                    <span className="step-label">Washing & Ironing</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 2)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 2) === 'completed' ? <Check size={18} /> : 3}
                    </div>
                    <span className="step-label">Ready for Pickup</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 3)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 3) === 'completed' ? <Check size={18} /> : 4}
                    </div>
                    <span className="step-label">Completed</span>
                  </div>
                </div>
              )}

              {/* Essential Order Details Grid */}
              <div className="essential-details-grid">
                <div className="essential-item">
                  <span className="essential-label">Collection Slot</span>
                  <span className="essential-value">{activeOrder.slot_date} • {activeOrder.start_time} - {activeOrder.end_time}</span>
                </div>

                <div className="essential-item">
                  <span className="essential-label">Total Bill Amount</span>
                  <span className="essential-value" style={{ color: '#38bdf8' }}>₹{Number(activeOrder.total_amount).toFixed(2)}</span>
                </div>

                <div className="essential-item">
                  <span className="essential-label">Payment Status</span>
                  <span className="essential-value">
                    <span className={`badge ${activeOrder.payment_status === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                      {activeOrder.payment_status || 'Unpaid'} {activeOrder.payment_method ? `(${activeOrder.payment_method})` : ''}
                    </span>
                  </span>
                </div>

                <div className="essential-item">
                  <span className="essential-label">Counter Desk</span>
                  <span className="essential-value">Hostel Ground Floor Desk</span>
                </div>
              </div>

              {/* Order Laundry Items (By Pair / Pieces) */}
              <div className="active-items-section">
                <div className="active-items-header">
                  <span>Laundry Items & Quantities</span>
                  <span>{activeOrder.total_clothes || (activeOrder.items?.reduce((s, it) => s + it.quantity, 0))} Total Items</span>
                </div>

                {activeOrder.items && activeOrder.items.length > 0 ? (
                  activeOrder.items.map((item, idx) => {
                    const unit = item.unit_type || 'pair';
                    const unitLabel = item.quantity === 1 ? unit : (unit === 'piece' ? 'pieces' : `${unit}s`);
                    const cleanTitle = (item.service_name || '').replace(/\s*\([^)]*\)/, '');
                    return (
                      <div key={idx} className="active-item-row">
                        <div className="item-name-part">
                          <span className="item-service-title">{cleanTitle || item.service_name}</span>
                          <span className="item-service-meta">
                            ₹{Number(item.unit_price).toFixed(0)} per {unit} • {item.turnaround_days || 1} day turnaround
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className="item-qty-badge">
                            {item.quantity} {unitLabel}
                          </span>
                          <strong style={{ minWidth: '70px', textAlign: 'right', color: '#fff' }}>
                            ₹{Number(item.line_total).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="active-item-row" style={{ color: 'var(--text-muted)' }}>
                    Standard laundry garments submitted.
                  </div>
                )}
              </div>

              {/* Notes if any */}
              {activeOrder.notes && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Special Instructions:</strong> {activeOrder.notes}
                </div>
              )}

              {/* Actions Footer */}
              <div className="active-card-actions">
                <button className="btn btn-secondary" onClick={() => onViewReceipt(activeOrder.booking_id)}>
                  <FileText size={16} />
                  <span>View Official Receipt</span>
                </button>
                <button className="btn btn-primary" onClick={onOpenNewBooking}>
                  <Plus size={16} />
                  <span>New Laundry Request</span>
                </button>
              </div>
            </div>
          ) : (
            /* Clean Empty State when student has no active order */
            <div className="empty-active-box">
              <div className="empty-active-icon">
                <Shirt size={28} />
              </div>
              <h3>No Laundry Orders Yet</h3>
              <p>You haven't placed any laundry bookings yet. Drop off your clean clothes for washing or pressing!</p>
              <button className="btn btn-primary" onClick={onOpenNewBooking}>
                <Plus size={16} />
                <span>Book Laundry Slot Now</span>
              </button>
            </div>
          )}

          {/* Student Orders History Section */}
          <div className="dashboard-card glass-panel" style={{ marginTop: '24px' }}>
            <div className="card-header-row">
              <div>
                <h3>My Laundry History & Receipts</h3>
                <p className="card-subtitle">All your past and present wardrobe requests</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('bookings')}>
                <span>View Full History</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="orders-list">
              {allStudentBookings.length === 0 ? (
                <div className="empty-notice">
                  No previous bookings found. Click "Book Laundry Slot" above to get started!
                </div>
              ) : (
                allStudentBookings.slice(0, 5).map((b) => (
                  <div key={b.booking_id} className="order-item-row">
                    <div className="order-token">
                      <span className="token-code-pill">{b.pickup_code}</span>
                      <span className="order-time">{b.slot_date} ({b.start_time})</span>
                    </div>

                    <div className="order-student-info" style={{ flex: 2 }}>
                      <div className="items-tags-list">
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it, idx) => (
                            <span key={idx} className="item-tag-chip">
                              {it.quantity} {it.unit_type === 'piece' ? (it.quantity > 1 ? 'pcs' : 'pc') : (it.quantity > 1 ? 'pairs' : 'pair')} {it.service_name.replace(/\s*\([^)]*\)/, '')}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.total_clothes} garments</span>
                        )}
                      </div>
                    </div>

                    <div className="order-meta">
                      <span className="order-amount">₹{Number(b.total_amount).toFixed(2)}</span>
                      {getStatusBadge(b.booking_status || b.status)}
                    </div>

                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => onViewReceipt(b.booking_id)}
                      title="View & Print Official Receipt"
                    >
                      <FileText size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* ADMIN-SPECIFIC VIEW: HOSTEL-WIDE OPERATIONS DASHBOARD */}
      {/* ============================================================== */}
      {isAdmin && (
        <>
          {/* KPI Cards Grid */}
          <div className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-icon-wrap icon-blue">
                <CalendarCheck size={22} />
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Active Laundry Orders</span>
                <span className="kpi-value">{kpis ? kpis.active_bookings : '--'}</span>
                <span className="kpi-hint">Pending / In Progress / Ready</span>
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

          {/* Admin Dual Grid: Recent Bookings & Slot Capacity */}
          <div className="dashboard-grid-2">
            {/* Recent Orders Timeline */}
            <div className="dashboard-card glass-panel">
              <div className="card-header-row">
                <div>
                  <h3>Recent Laundry Bookings (All Users)</h3>
                  <p className="card-subtitle">Live orders with student details and pickup tokens</p>
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
                        <span>Room: {b.room_no} • {b.register_no}</span>
                      </div>
                      <div className="order-meta">
                        <span className="order-amount">₹{Number(b.total_amount).toFixed(2)}</span>
                        {getStatusBadge(b.booking_status || b.status)}
                      </div>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => onViewReceipt(b.booking_id)}
                        title="View Official Receipt"
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
                  <h3>Available Drop-Off Slots</h3>
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
        </>
      )}
    </div>
  );
}
