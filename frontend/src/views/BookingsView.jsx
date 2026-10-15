import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Plus,
  Check,
  X,
  Play,
  PackageCheck,
  CheckCircle,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api';

export default function BookingsView({ currentUser, onOpenNewBooking, onViewReceipt }) {
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    loadBookings(true);

    // Auto-polling interval: 6s for Admin, 10s for Student
    const pollIntervalMs = isAdmin ? 6000 : 10000;
    const timer = setInterval(() => {
      loadBookings(false);
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [statusFilter, currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadBookings = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    else setIsRefreshing(true);

    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;
      // If student, strictly constrain query to their student_id
      if (isStudent && currentUser?.student_id) {
        params.student_id = currentUser.student_id;
      }
      const data = await api.getBookings(params);
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      if (showLoader) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBookings(true);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!isAdmin) return;
    setUpdatingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      showToast(`Booking #${bookingId} status updated to "${newStatus}"`);
      await loadBookings(false);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = async (bookingId) => {
    setUpdatingId(bookingId);
    try {
      const res = await api.acceptBooking(bookingId);
      showToast(res.message || `Booking #${bookingId} accepted!`);
      await loadBookings(false);
    } catch (err) {
      alert(`Accept failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
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

    setUpdatingId(rejectModalBooking.booking_id);
    try {
      const res = await api.rejectBooking(rejectModalBooking.booking_id, finalReason);
      setRejectModalBooking(null);
      showToast(res.message || `Booking #${rejectModalBooking.pickup_code} rejected.`);
      await loadBookings(false);
    } catch (err) {
      alert(`Reject failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending Approval</span>;
      case 'Accepted': return <span className="badge badge-accepted">Accepted</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Ready for Pickup': return <span className="badge badge-ready">Ready for Pickup</span>;
      case 'Completed': return <span className="badge badge-completed">Completed</span>;
      case 'Cancelled': return <span className="badge badge-cancelled">Cancelled</span>;
      case 'Rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const statuses = [
    { label: 'All Orders', value: '' },
    { label: 'Pending Requests', value: 'Pending' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Ready for Pickup', value: 'Ready for Pickup' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Rejected', value: 'Rejected' },
  ];

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

      {/* Top Header */}
      <div className="view-header-row">
        <div>
          <h2>{isAdmin ? 'Laundry Bookings & Orders Management' : 'My Laundry Orders & Receipts'}</h2>
          <p className="view-header-desc">
            {isAdmin 
              ? 'Review pending student requests, accept or reject bookings, and update statuses of ongoing laundry orders.' 
              : `Tracking active wardrobe requests for ${currentUser?.name || 'Student'} (${currentUser?.register_no})`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => loadBookings(false)}
              disabled={isRefreshing}
              title="Refresh latest bookings"
            >
              <RotateCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={onOpenNewBooking}>
            <Plus size={16} />
            <span>{isAdmin ? 'New Booking' : 'Book Laundry Slot'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-row glass-panel">
        {/* Status Pill Filters */}
        <div className="status-pills">
          {statuses.map(st => (
            <button
              key={st.value}
              className={`pill-btn ${statusFilter === st.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(st.value)}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder={isAdmin ? "Search by student, register no, or pickup code..." : "Search by pickup code or date..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Bookings Table Container */}
      <div className="data-table-container glass-panel">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner" />
            <p>Loading bookings records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-notice" style={{ padding: '40px' }}>
            {isStudent 
              ? "You haven't made any laundry bookings matching this criteria yet."
              : "No bookings found matching criteria."}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Pickup Token</th>
                <th>Student Details</th>
                <th>Slot Reserved</th>
                <th>Laundry Items (by Pair / Pieces)</th>
                <th>Total Bill</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const bStatus = b.booking_status || b.status;
                const isPending = bStatus === 'Pending';
                return (
                  <tr key={b.booking_id} style={isPending && isAdmin ? { background: 'rgba(245, 158, 11, 0.05)' } : {}}>
                    <td>
                      <div className="token-cell">
                        <span className="token-code-pill">{b.pickup_code}</span>
                        <span className="date-subtext">Order #{b.booking_id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="student-cell">
                        <strong>{b.student_name}</strong>
                        <span className="subtext">{b.student_email ? `${b.student_email} • ` : ''}{b.register_no} • Room {b.room_no}</span>
                      </div>
                    </td>
                    <td>
                      <div className="slot-cell">
                        <span>{b.slot_date}</span>
                        <span className="subtext">{b.start_time} - {b.end_time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="booking-items-summary">
                        <span className="clothes-count-badge" style={{ alignSelf: 'flex-start' }}>
                          {b.total_clothes} {b.total_clothes === 1 ? 'item' : 'items'}
                        </span>
                        {b.items && b.items.length > 0 && (
                          <div className="items-tags-list">
                            {b.items.map((it, idx) => (
                              <span key={idx} className="item-tag-chip">
                                <strong>{it.quantity} {it.unit_type === 'piece' ? (it.quantity > 1 ? 'pcs' : 'pc') : (it.quantity > 1 ? 'pairs' : 'pair')}</strong>&nbsp;{it.service_name.replace(/\s*\([^)]*\)/, '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong className="price-text">₹{Number(b.total_amount).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${b.payment_status === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td>
                      {isAdmin ? (
                        /* Admin Editable Dropdown */
                        <select
                          className="status-select-input"
                          value={bStatus}
                          disabled={updatingId === b.booking_id}
                          onChange={e => handleStatusChange(b.booking_id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Accepted">Accepted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready for Pickup">Ready for Pickup</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      ) : (
                        /* Student Read-Only Badge */
                        getStatusBadge(bStatus)
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {isAdmin && isPending && (
                          <>
                            <button 
                              className="btn btn-success btn-xs"
                              disabled={updatingId === b.booking_id}
                              onClick={() => handleAccept(b.booking_id)}
                              title="Accept student laundry request"
                            >
                              <Check size={13} />
                              <span>Accept</span>
                            </button>
                            <button 
                              className="btn btn-danger-outline btn-xs"
                              disabled={updatingId === b.booking_id}
                              onClick={() => handleOpenRejectModal(b)}
                              title="Reject booking request"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isAdmin && bStatus === 'Accepted' && (
                          <button 
                            className="btn btn-primary btn-xs"
                            disabled={updatingId === b.booking_id}
                            onClick={() => handleStatusChange(b.booking_id, 'In Progress')}
                            title="Start Washing"
                          >
                            <Play size={12} />
                            <span>Start Wash</span>
                          </button>
                        )}

                        {isAdmin && bStatus === 'In Progress' && (
                          <button 
                            className="btn btn-purple btn-xs"
                            disabled={updatingId === b.booking_id}
                            onClick={() => handleStatusChange(b.booking_id, 'Ready for Pickup')}
                            title="Mark ready for student pickup"
                          >
                            <PackageCheck size={12} />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {isAdmin && bStatus === 'Ready for Pickup' && (
                          <button 
                            className="btn btn-success btn-xs"
                            disabled={updatingId === b.booking_id}
                            onClick={() => handleStatusChange(b.booking_id, 'Completed')}
                            title="Complete and close order"
                          >
                            <CheckCircle size={12} />
                            <span>Complete</span>
                          </button>
                        )}

                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onViewReceipt(b.booking_id)}
                          title="View & Print Official Receipt"
                        >
                          <FileText size={14} />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
