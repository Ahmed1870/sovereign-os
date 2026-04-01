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
  alerts: any[];
}

interface AppStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats) => void;
  isScanning: boolean;
  scanProgress: number;
  scanResults: object | null;
  setScanning: (scanning: boolean) => void;
  setScanProgress: (progress: number) => void;
  setScanResults: (results: object) => void;
  clearScanResults: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
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
      dashboardStats: null,
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      isScanning: false,
      scanProgress: 0,
      scanResults: null,
      setScanning: (isScanning) => set({ isScanning }),
      setScanProgress: (scanProgress) => set({ scanProgress }),
      setScanResults: (scanResults) => set({ scanResults, isScanning: false, scanProgress: 100 }),
      clearScanResults: () => set({ scanResults: null, scanProgress: 0 }),
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

interface LangStore {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        if (typeof window !== 'undefined') {
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
        set({ lang });
      },
    }),
    { name: 'sovereign-lang' }
  )
);
