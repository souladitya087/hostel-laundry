import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Shirt, 
  Clock, 
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsView() {
  const [dailyData, setDailyData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [slotData, setSlotData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [daily, srv, slots] = await Promise.all([
        api.getDailyRevenue(),
        api.getServiceAnalytics(),
        api.getSlotUtilization()
      ]);
      setDailyData(daily);
      setServiceData(srv);
      setSlotData(slots);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2>Operational Reports & Financial Analytics</h2>
          <p className="view-header-desc">Aggregated metrics computed using SQL GROUP BY, JOINs, and Analytical Views</p>
        </div>
      </div>

      {loading ? (
        <div className="table-loading-state">
          <div className="spinner" />
          <p>Loading analytics and financial summaries...</p>
        </div>
      ) : (
        <div className="reports-layout-grid">
          {/* Daily Revenue Table */}
          <div className="report-card glass-panel">
            <div className="report-card-header">
              <div className="report-icon-title">
                <DollarSign size={20} className="text-success" />
                <h3>Daily Financial Collection (vw_daily_financial_summary)</h3>
              </div>
              <span className="badge badge-completed">Live View</span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>Total Bookings</th>
                    <th style={{ textAlign: 'center' }}>Completed</th>
                    <th style={{ textAlign: 'right' }}>Total Billed (₹)</th>
                    <th style={{ textAlign: 'right' }}>Revenue Collected (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No daily transactions yet.
                      </td>
                    </tr>
                  ) : (
                    dailyData.map((d, idx) => (
                      <tr key={idx}>
                        <td><strong>{d.report_date}</strong></td>
                        <td style={{ textAlign: 'center' }}>{d.total_bookings}</td>
                        <td style={{ textAlign: 'center' }}>{d.completed_count}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(d.total_billed).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="text-success">₹{Number(d.total_collected).toFixed(2)}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Volume Breakdown */}
          <div className="report-card glass-panel">
            <div className="report-card-header">
              <div className="report-icon-title">
                <Shirt size={20} className="text-primary" />
                <h3>Service Volume & Revenue (vw_service_analytics)</h3>
              </div>
              <span className="badge badge-progress">Category Aggregates</span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service Title</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ textAlign: 'center' }}>Garments Cleaned</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.map((s, idx) => (
                    <tr key={idx}>
                      <td><strong>{s.service_name}</strong></td>
                      <td><span className="badge">{s.category || 'Standard'}</span></td>
                      <td style={{ textAlign: 'right' }}>₹{Number(s.unit_price).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="clothes-count-badge">{s.total_clothes_cleaned}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-primary">₹{Number(s.total_revenue).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slot Occupancy Utilization */}
          <div className="report-card glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="report-card-header">
              <div className="report-icon-title">
                <Clock size={20} className="text-amber" />
                <h3>Slot Capacity & Machine Load Utilization (vw_slot_utilization)</h3>
              </div>
              <span className="badge badge-pending">Capacity Integrity</span>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Slot Date</th>
                    <th>Time Interval</th>
                    <th style={{ textAlign: 'center' }}>Max Capacity</th>
                    <th style={{ textAlign: 'center' }}>Active Bookings</th>
                    <th style={{ textAlign: 'center' }}>Available Seats</th>
                    <th>Utilization Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {slotData.map((s, idx) => {
                    const pct = Math.min(s.occupancy_pct || 0, 100);
                    return (
                      <tr key={idx}>
                        <td><strong>{s.slot_date}</strong></td>
                        <td>{s.start_time} - {s.end_time}</td>
                        <td style={{ textAlign: 'center' }}>{s.capacity}</td>
                        <td style={{ textAlign: 'center' }}>{s.booked_count}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${s.available_seats <= 0 ? 'badge-cancelled' : 'badge-completed'}`}>
                            {s.available_seats} remaining
                          </span>
                        </td>
                        <td style={{ width: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-bar-track" style={{ flex: 1 }}>
                              <div 
                                className={`progress-bar-fill ${pct >= 100 ? 'fill-red' : pct >= 70 ? 'fill-amber' : 'fill-blue'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.775rem', fontWeight: 600, width: '40px' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
