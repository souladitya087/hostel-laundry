const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg = errData.detail || errData.message || errorMsg;
      } catch (e) {
        // use default
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  registerStudent: (data) => request('/auth/register-student', { method: 'POST', body: JSON.stringify(data) }),
  getDemoUsers: () => request('/auth/demo-users'),

  // Database Admin
  getDbStatus: () => request('/db-admin/status'),
  reseedDatabase: () => request('/db-admin/reseed', { method: 'POST' }),

  // Dashboard & Reports
  getKpis: () => request('/reports/kpis'),
  getDailyRevenue: () => request('/reports/daily-revenue'),
  getServiceAnalytics: () => request('/reports/service-analytics'),
  getSlotUtilization: () => request('/reports/slot-utilization'),
  getRecentActivity: () => request('/reports/recent-activity'),

  // Students
  getStudents: (query = '') => request(`/students${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Services
  getServices: (includeInactive = false) => request(`/services?include_inactive=${includeInactive}`),
  getService: (id) => request(`/services/${id}`),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // Slots
  getSlots: () => request('/slots'),
  getAvailableSlots: () => request('/slots/available'),
  getSlot: (id) => request(`/slots/${id}`),
  createSlot: (data) => request('/slots', { method: 'POST', body: JSON.stringify(data) }),
  updateSlot: (id, data) => request(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSlot: (id) => request(`/slots/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.student_id) query.append('student_id', params.student_id);
    if (params.date) query.append('date', params.date);
    if (params.q) query.append('q', params.q);
    const qs = query.toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  getBooking: (id) => request(`/bookings/${id}`),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBookingStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: () => request('/payments'),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
};
