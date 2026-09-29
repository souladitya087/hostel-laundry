import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Home, 
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentsView() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    register_no: '',
    phone: '',
    email: '',
    room_no: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async (query = '') => {
    setLoading(true);
    try {
      const data = await api.getStudents(query);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadStudents(searchQuery);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      register_no: '',
      phone: '',
      email: '',
      room_no: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      register_no: student.register_no,
      phone: student.phone,
      email: student.email,
      room_no: student.room_no
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.student_id, formData);
      } else {
        await api.createStudent(formData);
      }
      setIsModalOpen(false);
      await loadStudents(searchQuery);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Delete this student profile?')) return;
    try {
      await api.deleteStudent(studentId);
      await loadStudents(searchQuery);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>Hostel Students Directory</h2>
          <p className="view-header-desc">Manage registered student profiles, room allocations, and contact records</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Student</span>
        </button>
      </div>

      {/* Search Header */}
      <div className="filter-controls-row glass-panel">
        <form onSubmit={handleSearch} className="search-form" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by student name, register no, or room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="data-table-container glass-panel">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner" />
            <p>Loading students directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-notice" style={{ padding: '40px' }}>
            No students found matching query.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Register No (Unique)</th>
                <th>Hostel Room</th>
                <th>Contact</th>
                <th style={{ textAlign: 'center' }}>Total Bookings</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id}>
                  <td>#{s.student_id}</td>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    <span className="badge badge-progress">{s.register_no}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Home size={14} className="text-secondary" />
                      <span>{s.room_no}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                      <span>{s.phone}</span>
                      <span className="subtext">{s.email}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="clothes-count-badge">
                      {s.total_bookings} {s.total_bookings === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => openEditModal(s)}
                        title="Edit Student"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm text-danger" 
                        onClick={() => handleDelete(s.student_id)}
                        title="Delete Student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student Profile' : 'Register New Hostel Student'}</h3>
              <button className="btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Register Number (Unique)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 2024CS45"
                    value={formData.register_no}
                    disabled={!!editingStudent}
                    onChange={e => setFormData({ ...formData, register_no: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hostel Room No</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. BH-304"
                    value={formData.room_no}
                    onChange={e => setFormData({ ...formData, room_no: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">College Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. rahul.cs24@campus.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingStudent ? 'Update Profile' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
