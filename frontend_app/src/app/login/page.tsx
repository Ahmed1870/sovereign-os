'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2, Languages } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';

const content = {
  en: {
    subtitle: 'Digital Identity Command Center',
    title: 'Sign In',
    desc: 'Access your command center',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'commander@sovereign.os',
    passwordPlaceholder: '••••••••••••',
    submit: 'Access Command Center',
    loading: 'Authenticating...',
    noAccount: 'No account?',
    createAccount: 'Create free account',
    footer: 'Zero-Knowledge · AES-256 Encrypted · Your data is yours.',
    successMsg: 'Welcome back, Commander.',
    errorMsg: 'Login failed. Check your credentials.',
  },
  ar: {
    subtitle: 'مركز قيادة الهوية الرقمية',
    title: 'تسجيل الدخول',
    desc: 'ادخل إلى مركز القيادة',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    emailPlaceholder: 'commander@sovereign.os',
    passwordPlaceholder: '••••••••••••',
    submit: 'دخول مركز القيادة',
    loading: 'جارٍ المصادقة...',
    noAccount: 'لا يوجد حساب؟',
    createAccount: 'أنشئ حساباً مجانياً',
    footer: 'صفر معرفة · مشفر بـ AES-256 · بياناتك ملكك.',
    successMsg: 'مرحباً بعودتك، قائد.',
    errorMsg: 'فشل تسجيل الدخول. تحقق من بياناتك.',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();
  const { lang, setLang } = useLangStore();
  const c = content[lang];
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.auth.login(form);
      setAuth({ user_id: data.user_id, email: data.email, subscription_tier: data.subscription_tier }, data.access_token);
      toast.success(c.successMsg);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || c.errorMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-void-900 flex items-center justify-center px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 bg-cosmos opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="fixed top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm transition-all"
      >
        <Languages className="w-4 h-4" />
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sovereign-600 flex items-center justify-center shadow-sovereign animate-glow mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl">Sovereign OS</h1>
          <p className="text-white/40 text-sm mt-1">{c.subtitle}</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="font-display font-bold text-xl mb-1">{c.title}</h2>
          <p className="text-white/40 text-sm mb-8">{c.desc}</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{c.email}</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                placeholder={c.emailPlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{c.password}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                  placeholder={c.passwordPlaceholder} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sovereign">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{c.loading}</> : c.submit}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              {c.noAccount}{' '}
              <Link href="/register" className="text-sovereign-400 hover:text-sovereign-300 font-medium">{c.createAccount}</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-white/20 text-xs mt-6">{c.footer}</p>
      </div>
    </div>
  );
}
