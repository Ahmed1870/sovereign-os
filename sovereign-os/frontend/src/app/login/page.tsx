'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.auth.login(form);
      setAuth(
        { user_id: data.user_id, email: data.email, subscription_tier: data.subscription_tier },
        data.access_token
      );
      toast.success('Welcome back, Commander.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-cosmos opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sovereign-600 flex items-center justify-center shadow-sovereign animate-glow mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl">Sovereign OS</h1>
          <p className="text-white/40 text-sm mt-1">Digital Identity Command Center</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="font-display font-bold text-xl mb-1">Sign In</h2>
          <p className="text-white/40 text-sm mb-8">Access your command center</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 focus:ring-1 focus:ring-sovereign-500/30 transition-all"
                placeholder="commander@sovereign.os"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 focus:ring-1 focus:ring-sovereign-500/30 transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sovereign"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Command Center'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              No account?{' '}
              <Link href="/register" className="text-sovereign-400 hover:text-sovereign-300 font-medium transition-colors">
                Create free account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Zero-Knowledge · AES-256 Encrypted · Your data is yours.
        </p>
      </div>
    </div>
  );
}
