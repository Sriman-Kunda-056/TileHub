import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getAlerts: () => api.get('/inventory/alerts'),
  getProduct: (productId) => api.get(`/inventory/${productId}`),
  adjust: (data) => api.post('/inventory/adjust', data),
  restock: (data) => api.post('/inventory/restock', data),
  updateSettings: (productId, data) => api.put(`/inventory/${productId}/settings`, data),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// ─── Shipments ───────────────────────────────────────────────────────────────
export const shipmentsAPI = {
  getAll: (params) => api.get('/shipments', { params }),
  getOne: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  scan: (qr_data) => api.post('/shipments/scan', { qr_data }),
  dispatch: (id, qr_code_data) => api.post(`/shipments/${id}/dispatch`, { qr_code_data }),
  markDelivered: (id) => api.put(`/shipments/${id}/deliver`),
};

// ─── Billing ─────────────────────────────────────────────────────────────────
export const billingAPI = {
  getInvoices: (params) => api.get('/billing/invoices', { params }),
  getInvoice: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/billing/invoices', data),
  recordPayment: (id, data) => api.post(`/billing/invoices/${id}/payment`, data),
  getPDF: (id) => `${API_URL}/billing/invoices/${id}/pdf`,
  generateBOQ: (data) => api.post('/billing/boq', data),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStock: () => api.get('/analytics/stock'),
  getSales: (params) => api.get('/analytics/sales', { params }),
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll: () => api.get('/customers'),
  create: (data) => api.post('/customers', data),
  bookShowroom: (data) => api.post('/customers/showroom-booking', data),
};

// ─── Quotations ──────────────────────────────────────────────────────────────
export const quotationsAPI = {
  getAll: () => api.get('/quotations'),
  submit: (data) => api.post('/quotations', data),
  updateStatus: (id, status) => api.put(`/quotations/${id}/status`, { status }),
};

export default api;
