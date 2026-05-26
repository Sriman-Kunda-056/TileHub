import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://tilehub-api.onrender.com/api';
// For production: 'https://tilehub-api.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear session
api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (phone, password) => api.post('/auth/login', { phone, password }),
  sendOTP:  (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP:(phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  getMe:    () => api.get('/auth/me'),

  saveSession: async (token, user) => {
    await AsyncStorage.multiSet([
      ['token', token],
      ['user', JSON.stringify(user)],
    ]);
  },

  getSession: async () => {
    const [token, userStr] = await AsyncStorage.multiGet(['token', 'user']);
    const tokenVal = token[1];
    const user = userStr[1] ? JSON.parse(userStr[1]) : null;
    if (!tokenVal || !user) return null;
    return { token: tokenVal, user };
  },

  clearSession: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryService = {
  getAll:    () => api.get('/inventory'),
  getAlerts: () => api.get('/inventory/alerts'),
  restock:   (product_id, quantity) => api.post('/inventory/restock', { product_id, quantity }),
  adjust:    (product_id, quantity_change, reason, note) =>
    api.post('/inventory/adjust', { product_id, quantity_change, reason, note }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderService = {
  getAll:       (params) => api.get('/orders', { params }),
  getOne:       (id) => api.get(`/orders/${id}`),
  create:       (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// ─── Shipments ────────────────────────────────────────────────────────────────
export const shipmentService = {
  getAll:       (params) => api.get('/shipments', { params }),
  getOne:       (id) => api.get(`/shipments/${id}`),
  create:       (data) => api.post('/shipments', data),
  scanQR:       (qr_data) => api.post('/shipments/scan', { qr_data }),
  dispatch:     (id) => api.post(`/shipments/${id}/dispatch`),
  markDelivered:(id) => api.put(`/shipments/${id}/deliver`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingService = {
  getInvoices:   (params) => api.get('/billing/invoices', { params }),
  getInvoice:    (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/billing/invoices', data),
  recordPayment: (id, data) => api.post(`/billing/invoices/${id}/payment`, data),
  generateBOQ:   (data) => api.post('/billing/boq', data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStock:     () => api.get('/analytics/stock'),
  getSales:     (params) => api.get('/analytics/sales', { params }),
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customerService = {
  getAll:       () => api.get('/customers'),
  create:       (data) => api.post('/customers', data),
  bookShowroom: (data) => api.post('/customers/showroom-booking', data),
};

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotationService = {
  getAll:  () => api.get('/quotations'),
  submit:  (data) => api.post('/quotations', data),
  update:  (id, status) => api.put(`/quotations/${id}/status`, { status }),
};

export default api;
