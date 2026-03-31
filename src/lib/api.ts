import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sovereign_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sovereign_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── API Methods ───────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (data: { email: string; password: string; full_name: string }) =>
      apiClient.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
  },

  scan: {
    username: (data: { username: string; platforms?: string[] }) =>
      apiClient.post('/scan/username', data),
    email: (data: { email: string; check_breaches?: boolean }) =>
      apiClient.post('/scan/email', data),
    full: (username: string, email: string) =>
      apiClient.post(`/scan/full?email=${encodeURIComponent(email)}`, { username }),
  },

  device: {
    simCheck: (phone_number: string) =>
      apiClient.post('/device/sim-check', { phone_number }),
    callForwardingGuide: (carrier?: string) =>
      apiClient.get('/device/call-forwarding-guide', { params: { carrier } }),
    sessionGuide: () =>
      apiClient.get('/device/session-guide'),
  },

  privacy: {
    generateGDPR: (data: {
      full_name: string;
      email: string;
      location_code?: string;
      broker_ids?: string[];
    }) => apiClient.post('/privacy/gdpr-requests', data),
    getBrokers: () => apiClient.get('/privacy/brokers'),
    summarizeAlerts: (alerts: object[]) =>
      apiClient.post('/privacy/summarize-alerts', alerts),
  },

  dashboard: {
    stats: () => apiClient.get('/dashboard/stats'),
    profile: () => apiClient.get('/dashboard/profile'),
  },
};
