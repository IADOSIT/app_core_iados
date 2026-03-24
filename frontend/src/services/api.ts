import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://coreapi.iados.online/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setAccessToken(data.accessToken);
          originalRequest.headers!.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ========================
// AUTH
// ========================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// ========================
// DASHBOARD
// ========================
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getProfit: (year?: number) => api.get('/dashboard/profit', { params: { year } }),
};

// ========================
// CLIENTS
// ========================
export const clientsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/clients', { params }),
  getOne: (id: string) => api.get(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post('/clients', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  addContact: (id: string, data: Record<string, unknown>) => api.post(`/clients/${id}/contacts`, data),
  revealPassword: (id: string) => api.get(`/clients/${id}/reveal-password`),
};

// ========================
// LICENSES
// ========================
export const licensesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/licenses', { params }),
  getOne: (id: string) => api.get(`/licenses/${id}`),
  create: (data: Record<string, unknown>) => api.post('/licenses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/licenses/${id}`, data),
  activate: (id: string) => api.post(`/licenses/${id}/activate`),
  renew: (id: string, data: { newEndDate: string }) => api.post(`/licenses/${id}/renew`, data),
  delete: (id: string) => api.delete(`/licenses/${id}`),
};

// ========================
// PAYMENTS
// ========================
export const paymentsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  getStats: (year?: number) => api.get('/payments/stats', { params: { year } }),
  getProjection: () => api.get('/payments/projection'),
  updateTeamSize: (teamSize: number) => api.post('/payments/team-size', { teamSize }),
  create: (data: Record<string, unknown>) => api.post('/payments', data),
  updateStatus: (id: string, data: Record<string, unknown>) => api.patch(`/payments/${id}/status`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
};

// ========================
// INVOICES
// ========================
export const invoicesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: Record<string, unknown>) => api.post('/invoices', data),
  updateStatus: (id: string, data: Record<string, unknown>) => api.patch(`/invoices/${id}/status`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

// ========================
// PRODUCTS
// ========================
export const productsApi = {
  getAll: (params?: { sort?: string; dir?: string }) => api.get('/products', { params }),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  addPlan: (id: string, data: Record<string, unknown>) => api.post(`/products/${id}/plans`, data),
  updatePlan: (id: string, planId: string, data: Record<string, unknown>) => api.put(`/products/${id}/plans/${planId}`, data),
  deletePlan: (id: string, planId: string) => api.delete(`/products/${id}/plans/${planId}`),
  regenerateSecret: (id: string) => api.post(`/products/${id}/regenerate-secret`),
  revealPassword: (id: string) => api.get(`/products/${id}/reveal-password`),
  getNotes: (id: string) => api.get(`/products/${id}/notes`),
  addNote: (id: string, note: string) => api.post(`/products/${id}/notes`, { note }),
  deleteNote: (id: string, noteId: string) => api.delete(`/products/${id}/notes/${noteId}`),
};

// ========================
// VERSIONS
// ========================
export const versionsApi = {
  getAll: (productId?: string) => api.get('/versions', { params: { productId } }),
  create: (data: Record<string, unknown>) => api.post('/versions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/versions/${id}`, data),
  delete: (id: string) => api.delete(`/versions/${id}`),
  assign: (data: Record<string, unknown>) => api.post('/versions/assign', data),
};

// ========================
// EXPENSES
// ========================
export const expensesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/expenses', { params }),
  getStats: (year?: number) => api.get('/expenses/stats', { params: { year } }),
  getCategories: () => api.get('/expenses/categories'),
  create: (data: Record<string, unknown>) => api.post('/expenses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ========================
// USERS
// ========================
export const usersApi = {
  getAll: () => api.get('/users'),
  getRoles: () => api.get('/users/roles'),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  resetPassword: (id: string, data: { newPassword: string }) => api.post(`/users/${id}/reset-password`, data),
  changePassword: (data: Record<string, unknown>) => api.post('/users/change-password', data),
};

// ========================
// MAINTENANCE
// ========================
export const maintenanceApi = {
  getStats: () => api.get('/maintenance/stats'),
  getBackupConfig: () => api.get('/maintenance/backup-config'),
  updateBackupConfig: (data: Record<string, unknown>) => api.put('/maintenance/backup-config', data),
  testSftp: (data: Record<string, unknown>) => api.post('/maintenance/backup-config/test', data),
  runBackup: (uploadToSftp?: boolean) => api.post('/maintenance/backup', { uploadToSftpFlag: uploadToSftp !== false }),
  deleteDemoData: () => api.delete('/maintenance/demo-data'),
};

// ========================
// NOTIFICATIONS
// ========================
export const notificationsApi = {
  getAll: (unreadOnly?: boolean) => api.get('/notifications', { params: { unreadOnly } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/notifications/settings', data),
};
