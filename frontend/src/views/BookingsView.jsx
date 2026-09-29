import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  QrCode,
  GraduationCap,
  ShieldCheck
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

  useEffect(() => {
    loadBookings();
  }, [statusFilter, currentUser]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;
      // If student, strictly constrain query to their student_id
      if (isStudent && currentUser?.student_id) {
        params.student_id = currentUser.student_id;
      }
      const data = await api.getBookings(params);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBookings();
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!isAdmin) return;
    setUpdatingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      await loadBookings();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
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

  const statuses = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Ready for Pickup', value: 'Ready for Pickup' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="view-header-row">
        <div>
          <h2>{isAdmin ? 'Laundry Bookings & Orders' : 'My Laundry Orders & Receipts'}</h2>
          <p className="view-header-desc">
            {isAdmin 
              ? 'Manage student bookings, process clothes, and issue official receipts' 
              : `Tracking active wardrobe requests for ${currentUser?.name || 'Student'} (${currentUser?.register_no})`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewBooking}>
          <Plus size={16} />
          <span>{isAdmin ? 'New Booking' : 'Book Laundry Slot'}</span>
        </button>
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
                <th style={{ textAlign: 'center' }}>Garments</th>
                <th>Total Bill</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.booking_id}>
                  <td>
                    <div className="token-cell">
                      <span className="token-code-pill">{b.pickup_code}</span>
                      <span className="date-subtext">Order #{b.booking_id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="student-cell">
                      <strong>{b.student_name}</strong>
                      <span className="subtext">{b.register_no} • Room {b.room_no}</span>
                    </div>
                  </td>
                  <td>
                    <div className="slot-cell">
                      <span>{b.slot_date}</span>
                      <span className="subtext">{b.start_time} - {b.end_time}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="clothes-count-badge">
                      {b.total_clothes} {b.total_clothes === 1 ? 'item' : 'items'}
                    </span>
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
                        value={b.booking_status}
                        disabled={updatingId === b.booking_id}
                        onChange={e => handleStatusChange(b.booking_id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      /* Student Read-Only Badge */
                      getStatusBadge(b.booking_status)
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewReceipt(b.booking_id)}
                      title="View & Print Official Receipt"
                    >
                      <FileText size={14} />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
