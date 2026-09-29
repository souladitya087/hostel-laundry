import React, { useState, useEffect } from 'react';
import { 
  Shirt, 
  Plus, 
  Edit2, 
  Clock, 
  DollarSign, 
  Tag, 
  X,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function ServicesView({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    unit_price: 40.0,
    turnaround_days: 1,
    description: '',
    category: 'Everyday'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await api.getServices(!isAdmin ? false : true);
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (!isAdmin) return;
    setEditingService(null);
    setFormData({
      service_name: '',
      unit_price: 40.0,
      turnaround_days: 1,
      description: '',
      category: 'Everyday'
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (srv) => {
    if (!isAdmin) return;
    setEditingService(srv);
    setFormData({
      service_name: srv.service_name,
      unit_price: srv.unit_price,
      turnaround_days: srv.turnaround_days,
      description: srv.description || '',
      category: srv.category || 'Everyday'
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    setError('');
    try {
      if (editingService) {
        await api.updateService(editingService.service_id, {
          ...formData,
          unit_price: parseFloat(formData.unit_price),
          turnaround_days: parseInt(formData.turnaround_days)
        });
      } else {
        await api.createService({
          ...formData,
          unit_price: parseFloat(formData.unit_price),
          turnaround_days: parseInt(formData.turnaround_days)
        });
      }
      setIsModalOpen(false);
      await loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>{isAdmin ? 'Laundry Services & Pricing Catalog' : 'Laundry Service Tariffs & Timelines'}</h2>
          <p className="view-header-desc">
            {isAdmin 
              ? 'Manage standard washing, dry cleaning rates, and garment turnaround guarantees' 
              : 'Official university laundry catalog with standardized pricing per garment piece and turnaround days'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add New Service</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="info-banner glass-panel">
          <Info size={18} className="text-primary" />
          <span>All charges are automatically computed per garment count. Turnaround represents business days required before counter collection.</span>
        </div>
      )}

      {loading ? (
        <div className="table-loading-state">
          <div className="spinner" />
          <p>Loading laundry catalog...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="empty-notice glass-panel" style={{ padding: '40px' }}>
          No services defined yet.
        </div>
      ) : (
        <div className="services-grid-view">
          {services.map(srv => (
            <div key={srv.service_id} className="service-catalog-card glass-panel">
              <div className="service-card-top">
                <span className="badge badge-progress">{srv.category || 'Standard'}</span>
                {isAdmin && (
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEditModal(srv)}
                    title="Edit Rate & Turnaround"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              <div className="service-card-main">
                <div className="service-icon-bubble">
                  <Shirt size={24} className="text-primary" />
                </div>
                <h3>{srv.service_name}</h3>
                <p className="service-desc">{srv.description || 'Standard university laundry handling.'}</p>
              </div>

              <div className="service-card-metrics">
                <div className="metric-box">
                  <span className="metric-label">UNIT RATE</span>
                  <strong className="metric-val text-primary">₹{Number(srv.unit_price).toFixed(2)}</strong>
                </div>
                <div className="metric-box">
                  <span className="metric-label">TURNAROUND</span>
                  <strong className="metric-val">{srv.turnaround_days} {srv.turnaround_days === 1 ? 'day' : 'days'}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal (Admin only) */}
      {isAdmin && isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service Details' : 'Add Laundry Service'}</h3>
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
                <label className="form-label">Service Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Silk & Woolens Steam Wash"
                  value={formData.service_name}
                  onChange={e => setFormData({ ...formData, service_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Unit Price (₹ / Item)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    className="form-input" 
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Turnaround Days</label>
                  <input 
                    type="number" 
                    min="0"
                    max="10"
                    className="form-input" 
                    value={formData.turnaround_days}
                    onChange={e => setFormData({ ...formData, turnaround_days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Everyday">Everyday Wash</option>
                  <option value="Express">Express Same-Day</option>
                  <option value="Specialty">Specialty Dry Cleaning</option>
                  <option value="Heavy">Heavy Bedding & Blankets</option>
                  <option value="Footwear">Footwear & Accessories</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  placeholder="Describe cleaning process and garment care..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
