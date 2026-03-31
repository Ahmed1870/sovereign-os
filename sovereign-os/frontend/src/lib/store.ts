import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
}

interface DashboardStats {
  security_score: number;
  grade: string;
  status: string;
  total_scans: number;
  breaches_found: number;
  platforms_exposed: number;
  deletion_requests_sent: number;
  last_scan_at: string | null;
  alerts: object[];
}

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Dashboard
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats) => void;

  // Scan state
  isScanning: boolean;
  scanProgress: number;
  scanResults: object | null;
  setScanning: (scanning: boolean) => void;
  setScanProgress: (progress: number) => void;
  setScanResults: (results: object) => void;
  clearScanResults: () => void;

  // UI state
  activePage: string;
  setActivePage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('sovereign_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('sovereign_token');
        set({ user: null, token: null, dashboardStats: null });
      },

      // Dashboard
      dashboardStats: null,
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      // Scan
      isScanning: false,
      scanProgress: 0,
      scanResults: null,
      setScanning: (isScanning) => set({ isScanning }),
      setScanProgress: (scanProgress) => set({ scanProgress }),
      setScanResults: (scanResults) => set({ scanResults, isScanning: false, scanProgress: 100 }),
      clearScanResults: () => set({ scanResults: null, scanProgress: 0 }),

      // UI
      activePage: 'dashboard',
      setActivePage: (activePage) => set({ activePage }),
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'sovereign-os-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
