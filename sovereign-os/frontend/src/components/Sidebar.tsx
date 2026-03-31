'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Radar, Smartphone, Trash2, LogOut, User, Lock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Command Center' },
  { href: '/dashboard/scan',    icon: Radar,            label: 'Identity Radar'  },
  { href: '/dashboard/device',  icon: Smartphone,       label: 'Device Monitor'  },
  { href: '/dashboard/privacy', icon: Trash2,           label: 'Shadow Cleaner'  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    clearAuth();
    toast.success('Signed out.');
    router.push('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-void-800/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-sovereign-600 flex items-center justify-center shadow-sovereign">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-sm">Sovereign OS</div>
          <div className="text-xs text-white/30 font-mono">v1.0.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-sovereign-600/20 text-white border border-sovereign-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className={`w-4 h-4 ${active ? 'text-sovereign-400' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        {/* Subscription badge */}
        <div className="px-3 py-2 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-sovereign-400" />
            <span className="text-xs font-mono text-sovereign-400 uppercase tracking-wider">
              {user?.subscription_tier ?? 'free'} tier
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-void-700/40">
          <div className="w-7 h-7 rounded-lg bg-sovereign-600/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-sovereign-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.email}</div>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
