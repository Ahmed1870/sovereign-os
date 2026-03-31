'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import toast from 'react-hot-toast';

const passwordRules = [
  { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(form.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast.error('Password does not meet security requirements.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.auth.register(form);
      setAuth(
        { user_id: data.user_id, email: data.email, subscription_tier: data.subscription_tier },
        data.access_token
      );
      toast.success('Welcome to Sovereign OS, Commander.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900 flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 bg-cosmos opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sovereign-600 flex items-center justify-center shadow-sovereign animate-glow mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl">Create Your Fortress</h1>
          <p className="text-white/40 text-sm mt-1">Free forever · No credit card required</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 focus:ring-1 focus:ring-sovereign-500/30 transition-all"
                placeholder="John Sovereign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 focus:ring-1 focus:ring-sovereign-500/30 transition-all"
                placeholder="you@domain.com"
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
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {passwordRules.map((rule) => {
                    const ok = rule.test(form.password);
                    return (
                      <div key={rule.label} className={`flex items-center gap-2 text-xs ${ok ? 'text-threat-low' : 'text-white/30'}`}>
                        {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValid}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sovereign mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Fortress...</>
              ) : (
                'Activate Sovereign OS'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-sovereign-400 hover:text-sovereign-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
