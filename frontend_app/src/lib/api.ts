import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sovereign-os-production-06e0.up.railway.app';

export const apiClient = axios.create({
  baseURL: API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sovereign_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if ((error.response?.status === 401 || error.response?.status === 403) && typeof window !== 'undefined') {
      localStorage.removeItem('sovereign_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    register: (data: any) => apiClient.post('/api/v1/auth/register', data),
    login: (data: any) => apiClient.post('/api/v1/auth/login', data),
    logout: () => apiClient.post('/api/v1/auth/logout'),
  },
  scan: {
    username: (data: any) => apiClient.post('/api/v1/scan/username', data),
    email: (data: any) => apiClient.post('/api/v1/scan/email', data),
    full: (username: string, email: string) =>
      apiClient.post(`/api/v1/scan/full?email=${encodeURIComponent(email)}`, { username }),
  },
  device: {
    simCheck: (phone_number: string) => apiClient.post('/api/v1/device/sim-check', { phone_number }),
    callForwardingGuide: (carrier?: string) => apiClient.get('/api/v1/device/call-forwarding-guide', { params: { carrier } }),
    sessionGuide: () => apiClient.get('/api/v1/device/session-guide'),
  },
  privacy: {
    generateGDPR: (data: any) => apiClient.post('/api/v1/privacy/gdpr-requests', data),
    getBrokers: () => apiClient.get('/api/v1/privacy/brokers'),
    summarizeAlerts: (alerts: object[]) => apiClient.post('/api/v1/privacy/summarize-alerts', alerts),
  },
  dashboard: {
    stats: () => apiClient.get('/api/v1/dashboard/stats'),
    profile: () => apiClient.get('/api/v1/dashboard/profile'),
  },
  health: {
    check: () => apiClient.get('/health'),
  }
};
