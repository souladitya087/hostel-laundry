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
  XCircle,
  Clock,
  RotateCw,
  Play,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ currentUser, onOpenNewBooking, onViewReceipt, onNavigateTab }) {
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const [kpis, setKpis] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [allStudentBookings, setAllStudentBookings] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [slotUtilization, setSlotUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Reject modal state
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('Slot capacity reached for this time interval');
  const [customRejectReason, setCustomRejectReason] = useState('');

  const quickReasons = [
    'Slot capacity reached for this time interval',
    'Requested laundry service temporarily unavailable',
    'Hostel counter maintenance / power disruption',
    'Garment count exceeds single-slot processing limit',
    'Other (specified below)'
  ];

  useEffect(() => {
    loadDashboardData(true);

    // Auto-polling interval: 6 seconds for Admin, 10 seconds for Student
    const pollIntervalMs = isAdmin ? 6000 : 10000;
    const timer = setInterval(() => {
      loadDashboardData(false);
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadDashboardData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    else setIsRefreshing(true);

    try {
      if (isAdmin) {
        const [kpisData, pendingData, allBookingsData, slotsData] = await Promise.all([
          api.getKpis(),
          api.getBookings({ status: 'Pending' }),
          api.getBookings(),
          api.getSlotUtilization()
        ]);
        setKpis(kpisData);
        setPendingRequests(pendingData || []);

        // Filter ongoing active orders: Accepted, In Progress, Ready for Pickup
        const ongoing = (allBookingsData || []).filter(b => 
          ['Accepted', 'In Progress', 'Ready for Pickup'].includes(b.booking_status || b.status)
        );
        setOngoingOrders(ongoing);
        setRecentBookings((allBookingsData || []).slice(0, 8));
        setSlotUtilization((slotsData || []).slice(0, 5));
      } else if (isStudent && currentUser?.student_id) {
        const studentBookings = await api.getBookings({ student_id: currentUser.student_id });
        setAllStudentBookings(studentBookings || []);

        // Find primary active order:
        // 1. Ongoing order (Pending, Accepted, In Progress, Ready for Pickup)
        // 2. If no ongoing order, show latest completed/cancelled/rejected order
        const ongoingOrdersList = (studentBookings || []).filter(b => 
          ['Pending', 'Accepted', 'In Progress', 'Ready for Pickup'].includes(b.booking_status || b.status)
        );
        const primaryOrder = ongoingOrdersList.length > 0 
          ? ongoingOrdersList[0] 
          : ((studentBookings && studentBookings.length > 0) ? studentBookings[0] : null);

        setActiveOrder(primaryOrder);
        setRecentBookings((studentBookings || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      if (showLoader) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Admin Actions
  const handleAcceptRequest = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      const res = await api.acceptBooking(bookingId);
      showToast(res.message || `Booking #${bookingId} accepted successfully!`);
      await loadDashboardData(false);
    } catch (err) {
      alert(`Failed to accept booking: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (booking) => {
    setRejectModalBooking(booking);
    setRejectReason('Slot capacity reached for this time interval');
    setCustomRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalBooking) return;
    const finalReason = rejectReason === 'Other (specified below)' 
      ? (customRejectReason.trim() || 'Declined by laundry administrator') 
      : rejectReason;

    setActionLoadingId(rejectModalBooking.booking_id);
    try {
      const res = await api.rejectBooking(rejectModalBooking.booking_id, finalReason);
      setRejectModalBooking(null);
      showToast(res.message || `Booking #${rejectModalBooking.pickup_code} rejected.`);
      await loadDashboardData(false);
    } catch (err) {
      alert(`Failed to reject booking: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateOrderStatus = async (bookingId, newStatus) => {
    setActionLoadingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      showToast(`Order status updated to "${newStatus}"!`);
      await loadDashboardData(false);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Accepted': return <span className="badge badge-accepted">Accepted</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Ready for Pickup': return <span className="badge badge-ready">Ready for Pickup</span>;
      case 'Completed': return <span className="badge badge-completed">Completed</span>;
      case 'Cancelled': return <span className="badge badge-cancelled">Cancelled</span>;
      case 'Rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getStepStatus = (orderStatus, stepIndex) => {
    // 0: Pending, 1: Accepted, 2: In Progress, 3: Ready for Pickup, 4: Completed
    if (orderStatus === 'Completed') return 'completed';
    const statusMap = {
      'Pending': 0,
      'Accepted': 1,
      'In Progress': 2,
      'Ready for Pickup': 3,
      'Completed': 4
    };
    const current = statusMap[orderStatus] ?? -1;
    if (current > stepIndex) return 'completed';
    if (current === stepIndex) return 'current';
    return '';
  };

  const getStepProgressPercent = (orderStatus) => {
    switch (orderStatus) {
      case 'Pending': return 10;
      case 'Accepted': return 35;
      case 'In Progress': return 62;
      case 'Ready for Pickup': return 88;
      case 'Completed': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="table-loading-state" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading laundry operations dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="action-toast-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

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
              ? 'Campus Laundry Operations & Request Management'
              : `Welcome back, ${currentUser?.name || 'Student'}!`}
          </h2>
          <p>
            {isAdmin 
              ? 'Real-time student booking requests review, instant order acceptance/rejection, and ongoing status workflow.'
              : `Hostel Room: ${currentUser?.room_no || '--'} • Email: ${currentUser?.email || '--'} • Roll No: ${currentUser?.register_no || '--'}`}
          </p>
        </div>
        <div className="banner-actions">
          {isAdmin && (
            <div className="live-sync-bar" title="Live status updater polls for new student requests automatically">
              <span className="live-pulse-dot" />
              <span>Live Auto-Sync</span>
              <button 
                className="btn btn-ghost btn-xs" 
                onClick={() => loadDashboardData(false)}
                disabled={isRefreshing}
                title="Refresh latest data now"
              >
                <RotateCw size={12} className={isRefreshing ? 'spin-anim' : ''} />
              </button>
            </div>
          )}
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
            /* Active Laundry Order Card with Visual Tracker & Breakdown */
            <div className="student-active-card">
              <div className="active-card-top">
                <div className="active-token-header">
                  <span className="active-token-badge">{activeOrder.pickup_code}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#fff' }}>
                      {['Pending', 'Accepted', 'In Progress', 'Ready for Pickup'].includes(activeOrder.booking_status || activeOrder.status) 
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

              {/* Status Specific Alerts for Student */}
              {(activeOrder.booking_status || activeOrder.status) === 'Pending' && (
                <div className="admin-pending-alert glass-panel" style={{ margin: '14px 0', padding: '12px 16px' }}>
                  <div className="admin-pending-alert-left">
                    <Clock size={20} className="text-warning" />
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>Request Submitted — Pending Admin Review</strong>
                      <p style={{ fontSize: '0.8rem' }}>The hostel laundry administrator is reviewing your booking slot request. Status will update here once confirmed.</p>
                    </div>
                  </div>
                </div>
              )}

              {(activeOrder.booking_status || activeOrder.status) === 'Accepted' && (
                <div className="admin-pending-alert glass-panel" style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.4)' }}>
                  <div className="admin-pending-alert-left">
                    <CheckCircle size={20} style={{ color: '#38bdf8' }} />
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#38bdf8' }}>Booking Request Accepted by Laundry Desk!</strong>
                      <p style={{ fontSize: '0.8rem' }}>Please bring your clothes to the hostel laundry desk during your reserved slot: {activeOrder.slot_date} ({activeOrder.start_time} - {activeOrder.end_time}).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Status Indicator: Stepper for active/completed, Banner for cancelled/rejected */}
              {(activeOrder.booking_status || activeOrder.status) === 'Rejected' ? (
                <div className="cancelled-order-banner" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.08)' }}>
                  <XCircle size={22} className="text-danger" />
                  <div>
                    <strong>Order Request Declined by Admin</strong>
                    <p>The laundry administrator was unable to accept this booking request.</p>
                    {activeOrder.notes && (
                      <p style={{ marginTop: '6px', fontSize: '0.825rem', color: '#fb7185' }}>
                        {activeOrder.notes}
                      </p>
                    )}
                  </div>
                </div>
              ) : (activeOrder.booking_status || activeOrder.status) === 'Cancelled' ? (
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
                    <span className="step-label">Accepted</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 2)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 2) === 'completed' ? <Check size={18} /> : 3}
                    </div>
                    <span className="step-label">Washing & Ironing</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 3)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 3) === 'completed' ? <Check size={18} /> : 4}
                    </div>
                    <span className="step-label">Ready for Pickup</span>
                  </div>

                  <div className={`step-node ${getStepStatus(activeOrder.booking_status || activeOrder.status, 4)}`}>
                    <div className="step-circle">
                      {getStepStatus(activeOrder.booking_status || activeOrder.status, 4) === 'completed' ? <Check size={18} /> : 5}
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
                  <span>{activeOrder.total_clothes || (activeOrder.items ? activeOrder.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0)} Total Items</span>
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

              {/* Special Notes if any */}
              {activeOrder.notes && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Order Notes:</strong> {activeOrder.notes}
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
                              {it.quantity} {it.unit_type === 'piece' ? (it.quantity > 1 ? 'pcs' : 'pc') : (it.quantity > 1 ? 'pairs' : 'pair')} {(it.service_name || '').replace(/\s*\([^)]*\)/, '')}
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
          {/* Action Required Alert Banner if Pending Requests exist */}
          {pendingRequests.length > 0 && (
            <div className="admin-pending-alert glass-panel">
              <div className="admin-pending-alert-left">
                <Clock size={24} className="text-warning pulse-anim" />
                <div>
                  <strong>Action Required: {pendingRequests.length} New Laundry Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Review</strong>
                  <p>Students have reserved laundry slots. Please accept or reject their requests to manage capacity.</p>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  const el = document.getElementById('latest-requests-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Review Requests</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* KPI Cards Grid */}
          <div className="kpi-grid">
            <div className="kpi-card glass-panel" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="kpi-icon-wrap icon-amber">
                <Clock size={22} />
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Pending Requests</span>
                <span className="kpi-value" style={{ color: '#fbbf24' }}>{pendingRequests.length}</span>
                <span className="kpi-hint">Awaiting Admin Accept/Reject</span>
              </div>
            </div>

            <div className="kpi-card glass-panel" style={{ borderLeft: '4px solid #38bdf8' }}>
              <div className="kpi-icon-wrap icon-blue">
                <CalendarCheck size={22} />
              </div>
              <div className="kpi-details">
                <span className="kpi-title">Ongoing Orders</span>
                <span className="kpi-value">{ongoingOrders.length}</span>
                <span className="kpi-hint">Accepted / In Wash / Ready</span>
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
                <span className="kpi-hint">Capacity utilization</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* FEATURE 1: LATEST BOOKING REQUESTS (ACCEPT / REJECT)          */}
          {/* ============================================================== */}
          <div id="latest-requests-section" className="admin-pending-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h3>Latest Laundry Booking Requests</h3>
                <span className="pending-counter-badge">
                  {pendingRequests.length} {pendingRequests.length === 1 ? 'Request' : 'Requests'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Accept or decline student slot reservations
                </span>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="dashboard-card glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', marginBottom: '12px' }}>
                  <CheckCircle size={32} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.05rem' }}>All Caught Up!</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                  There are no pending booking requests right now. When students book laundry slots from their portal, their requests will appear here in real time for approval.
                </p>
              </div>
            ) : (
              <div className="pending-requests-grid">
                {pendingRequests.map((b) => (
                  <div key={b.booking_id} className="pending-request-card">
                    <div className="pending-card-top">
                      <div className="pending-card-student">
                        <strong>{b.student_name}</strong>
                        <span>Room {b.room_no} • {b.register_no} {b.student_phone ? `• ${b.student_phone}` : ''}</span>
                      </div>
                      <span className="token-code-pill">{b.pickup_code}</span>
                    </div>

                    <div className="pending-card-details-box">
                      <div className="pending-detail-row">
                        <span className="pending-detail-label">Requested Slot:</span>
                        <span className="pending-detail-value">{b.slot_date} ({b.start_time} - {b.end_time})</span>
                      </div>
                      <div className="pending-detail-row">
                        <span className="pending-detail-label">Estimated Bill:</span>
                        <span className="pending-detail-value" style={{ color: '#38bdf8' }}>₹{Number(b.total_amount).toFixed(2)}</span>
                      </div>
                      <div className="pending-detail-row">
                        <span className="pending-detail-label">Payment Status:</span>
                        <span className="pending-detail-value">
                          <span className={`badge ${b.payment_status === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                            {b.payment_status || 'Unpaid'} {b.payment_method ? `(${b.payment_method})` : ''}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Line Items breakdown */}
                    <div className="pending-card-items-wrap">
                      <span className="pending-items-title">Clothes & Services ({b.total_clothes} Items):</span>
                      <div className="items-tags-list">
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it, idx) => (
                            <span key={idx} className="item-tag-chip">
                              {it.quantity} {it.unit_type === 'piece' ? (it.quantity > 1 ? 'pcs' : 'pc') : (it.quantity > 1 ? 'pairs' : 'pair')} {(it.service_name || '').replace(/\s*\([^)]*\)/, '')}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.total_clothes} garments</span>
                        )}
                      </div>
                    </div>

                    {/* Student notes if any */}
                    {b.notes && (
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                        <strong>Student Note:</strong> {b.notes}
                      </div>
                    )}

                    {/* Action Buttons: Accept / Reject */}
                    <div className="pending-card-actions">
                      <button 
                        className="btn btn-success btn-sm"
                        disabled={actionLoadingId === b.booking_id}
                        onClick={() => handleAcceptRequest(b.booking_id)}
                        title="Accept and approve this laundry slot request"
                      >
                        <Check size={15} />
                        <span>{actionLoadingId === b.booking_id ? 'Accepting...' : 'Accept Request'}</span>
                      </button>

                      <button 
                        className="btn btn-danger-outline btn-sm"
                        disabled={actionLoadingId === b.booking_id}
                        onClick={() => handleOpenRejectModal(b)}
                        title="Reject this booking request"
                      >
                        <X size={15} />
                        <span>Reject</span>
                      </button>

                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => onViewReceipt(b.booking_id)}
                        title="View Receipt"
                        style={{ flex: 'none', padding: '6px 10px' }}
                      >
                        <FileText size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* FEATURE 2: ONGOING ORDERS & LIVE STATUS MANAGEMENT           */}
          {/* ============================================================== */}
          <div className="ongoing-orders-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <h3>Ongoing Orders & Live Status Control</h3>
                <span className="badge badge-progress">
                  {ongoingOrders.length} In Progress
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('bookings')}>
                <span>View All Orders</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="ongoing-orders-table-wrap">
              {ongoingOrders.length === 0 ? (
                <div className="empty-notice" style={{ padding: '36px' }}>
                  No ongoing orders in the washing pipeline. Accepted bookings will appear here for progress tracking.
                </div>
              ) : (
                ongoingOrders.map((b) => (
                  <div key={b.booking_id} className="ongoing-order-row-item">
                    <div className="ongoing-order-main">
                      <span className="token-code-pill">{b.pickup_code}</span>
                      <div className="ongoing-order-student">
                        <strong>{b.student_name}</strong>
                        <span>Room {b.room_no} • {b.register_no}</span>
                      </div>
                    </div>

                    <div className="ongoing-order-slot">
                      <span>{b.slot_date}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.start_time} - {b.end_time}</span>
                    </div>

                    <div className="ongoing-order-items-preview">
                      <div className="items-tags-list">
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it, idx) => (
                            <span key={idx} className="item-tag-chip">
                              {it.quantity} {it.unit_type === 'piece' ? (it.quantity > 1 ? 'pcs' : 'pc') : (it.quantity > 1 ? 'pairs' : 'pair')} {(it.service_name || '').replace(/\s*\([^)]*\)/, '')}
                            </span>
                          ))
                        ) : (
                          <span>{b.total_clothes} garments</span>
                        )}
                      </div>
                    </div>

                    <div style={{ minWidth: '90px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>₹{Number(b.total_amount).toFixed(2)}</strong>
                    </div>

                    <div className="ongoing-order-status-block">
                      {getStatusBadge(b.booking_status || b.status)}

                      {/* Quick stage progression action */}
                      {(b.booking_status || b.status) === 'Accepted' && (
                        <button 
                          className="btn btn-primary btn-xs"
                          disabled={actionLoadingId === b.booking_id}
                          onClick={() => handleUpdateOrderStatus(b.booking_id, 'In Progress')}
                          title="Advance order to Washing & Ironing"
                        >
                          <Play size={12} />
                          <span>Start Wash</span>
                        </button>
                      )}

                      {(b.booking_status || b.status) === 'In Progress' && (
                        <button 
                          className="btn btn-purple btn-xs"
                          disabled={actionLoadingId === b.booking_id}
                          onClick={() => handleUpdateOrderStatus(b.booking_id, 'Ready for Pickup')}
                          title="Mark laundry ready for student pickup"
                        >
                          <PackageCheck size={12} />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {(b.booking_status || b.status) === 'Ready for Pickup' && (
                        <button 
                          className="btn btn-success btn-xs"
                          disabled={actionLoadingId === b.booking_id}
                          onClick={() => handleUpdateOrderStatus(b.booking_id, 'Completed')}
                          title="Mark order collected by student"
                        >
                          <CheckCircle size={12} />
                          <span>Complete</span>
                        </button>
                      )}

                      {/* Dropdown to switch to ANY status directly */}
                      <select
                        className="status-select-input"
                        value={b.booking_status || b.status}
                        disabled={actionLoadingId === b.booking_id}
                        onChange={(e) => handleUpdateOrderStatus(b.booking_id, e.target.value)}
                        title="Update order status directly"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      <button 
                        className="btn btn-ghost btn-xs"
                        onClick={() => onViewReceipt(b.booking_id)}
                        title="View Official Receipt"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Dual Grid: Recent Bookings & Slot Capacity */}
          <div className="dashboard-grid-2">
            {/* Recent Orders Timeline */}
            <div className="dashboard-card glass-panel">
              <div className="card-header-row">
                <div>
                  <h3>All Recent Bookings</h3>
                  <p className="card-subtitle">Live bookings history with student details and pickup tokens</p>
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
                  <h3>Drop-Off Slots Capacity</h3>
                  <p className="card-subtitle">Limits enforced via Relational DBMS stored procedures</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('slots')}>
                  <span>Manage Slots</span>
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

      {/* Reject Booking Modal Dialog */}
      {rejectModalBooking && (
        <div className="reject-modal-overlay" onClick={() => setRejectModalBooking(null)}>
          <div className="reject-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="reject-modal-header">
              <AlertTriangle size={24} className="text-danger" />
              <div>
                <h3>Reject Booking Request</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Token {rejectModalBooking.pickup_code} • {rejectModalBooking.student_name} (Room {rejectModalBooking.room_no})
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to decline this booking request? The student will be informed and the slot capacity will remain available for other students.
            </p>

            <div>
              <label className="form-label">Select Rejection Reason:</label>
              <div className="quick-reasons-list">
                {quickReasons.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`quick-reason-btn ${rejectReason === r ? 'selected' : ''}`}
                    onClick={() => setRejectReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {rejectReason === 'Other (specified below)' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Enter specific rejection reason for the student..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="reject-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setRejectModalBooking(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={handleConfirmReject}
              >
                <X size={15} />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
