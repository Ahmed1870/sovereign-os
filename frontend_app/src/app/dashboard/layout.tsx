'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-void-900 flex">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />
      <Sidebar />
      <main className="flex-1 ml-64 relative z-10 min-h-screen">
        {children}
      </main>
    </div>
  );
}
