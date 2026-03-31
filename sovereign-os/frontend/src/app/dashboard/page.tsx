'use client';
import { useEffect, useState } from 'react';
import { Shield, Radar, Smartphone, Trash2, AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import SecurityScoreRing from '@/components/SecurityScoreRing';
import StatCard from '@/components/StatCard';
import AlertFeed from '@/components/AlertFeed';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, dashboardStats, setDashboardStats } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats()
      .then(({ data }) => {
        setDashboardStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Use demo data if API not connected
        setDashboardStats({
          security_score: 72,
          grade: 'B',
          status: 'Good',
          total_scans: 3,
          breaches_found: 2,
          platforms_exposed: 8,
          deletion_requests_sent: 0,
          last_scan_at: new Date().toISOString(),
          alerts: [
            { id: '1', title: 'Email found in 2 breaches', severity: 'high', created_at: new Date().toISOString() },
            { id: '2', title: 'Profile exposed on 3 high-risk platforms', severity: 'medium', created_at: new Date().toISOString() },
          ],
        });
        setLoading(false);
      });
  }, [setDashboardStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-sovereign-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 font-mono text-sm">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardStats;
  const score = stats?.security_score ?? 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-mono text-sovereign-400 mb-2 uppercase tracking-widest">
          <Activity className="w-3 h-3" />
          Command Center
        </div>
        <h1 className="font-display font-bold text-3xl">
          Welcome back, <span className="gradient-text">{user?.email?.split('@')[0]}</span>
        </h1>
        <p className="text-white/40 mt-1">
          {stats?.last_scan_at
            ? `Last scan: ${new Date(stats.last_scan_at).toLocaleDateString()}`
            : 'No scans run yet — start your first identity scan below.'}
        </p>
      </div>

      {/* Top grid: Score + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Security Score - takes 1 column */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-white/40 mb-4 uppercase tracking-widest">Security Score</div>
          <SecurityScoreRing score={score} grade={stats?.grade ?? 'N/A'} status={stats?.status ?? 'Unknown'} />
        </div>

        {/* Stat cards - take 3 columns */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={Radar} label="Total Scans" value={stats?.total_scans ?? 0} color="sovereign" />
          <StatCard icon={AlertTriangle} label="Breaches Found" value={stats?.breaches_found ?? 0} color="critical" urgent={!!stats?.breaches_found} />
          <StatCard icon={Shield} label="Platforms Exposed" value={stats?.platforms_exposed ?? 0} color="medium" />
          <StatCard icon={Trash2} label="Deletions Sent" value={stats?.deletion_requests_sent ?? 0} color="low" />
          <StatCard icon={TrendingUp} label="Grade" value={stats?.grade ?? 'N/A'} color="sovereign" isText />
          <StatCard icon={Clock} label="Status" value={stats?.status ?? 'Unknown'} color="info" isText />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            href: '/dashboard/scan',
            icon: Radar,
            title: 'Run Identity Scan',
            desc: 'Scan username & email across platforms',
            color: 'sovereign',
          },
          {
            href: '/dashboard/device',
            icon: Smartphone,
            title: 'Check SIM Integrity',
            desc: 'Detect SIM swap & call forwarding',
            color: 'high',
          },
          {
            href: '/dashboard/privacy',
            icon: Trash2,
            title: 'Clean My Data',
            desc: 'Generate GDPR deletion requests',
            color: 'medium',
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card p-5 hover:border-sovereign-600/40 transition-all duration-300 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-sovereign-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-sovereign-600/20 transition-colors">
              <action.icon className="w-5 h-5 text-sovereign-400" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">{action.title}</div>
              <div className="text-white/40 text-xs">{action.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-lg">Recent Alerts</h2>
          <span className="text-xs font-mono text-white/30">LIVE FEED</span>
        </div>
        <AlertFeed alerts={stats?.alerts ?? []} />
      </div>
    </div>
  );
}
