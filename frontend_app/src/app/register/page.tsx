'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2, Check, X, Languages } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';

const content = {
  en: {
    title: 'Create Your Fortress',
    sub: 'Free forever · No credit card required',
    name: 'Full Name', namePlaceholder: 'John Sovereign',
    email: 'Email', emailPlaceholder: 'you@domain.com',
    password: 'Password', passwordPlaceholder: 'Create a strong password',
    submit: 'Activate Sovereign OS',
    loading: 'Creating Fortress...',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    rules: ['At least 12 characters', 'Uppercase letter', 'Lowercase letter', 'Number', 'Special character'],
    successMsg: 'Welcome to Sovereign OS, Commander.',
    errorMsg: 'Registration failed. Try again.',
  },
  ar: {
    title: 'أنشئ حصنك الرقمي',
    sub: 'مجاني للأبد · لا بطاقة ائتمانية',
    name: 'الاسم الكامل', namePlaceholder: 'أحمد محمد',
    email: 'البريد الإلكتروني', emailPlaceholder: 'you@domain.com',
    password: 'كلمة المرور', passwordPlaceholder: 'أنشئ كلمة مرور قوية',
    submit: 'تفعيل Sovereign OS',
    loading: 'جارٍ إنشاء الحصن...',
    hasAccount: 'لديك حساب بالفعل؟',
    signIn: 'تسجيل الدخول',
    rules: ['12 حرفاً على الأقل', 'حرف كبير', 'حرف صغير', 'رقم', 'رمز خاص'],
    successMsg: 'مرحباً بك في Sovereign OS، قائد.',
    errorMsg: 'فشل التسجيل. حاول مرة أخرى.',
  },
};

const passwordTests = [
  (p: string) => p.length >= 12,
  (p: string) => /[A-Z]/.test(p),
  (p: string) => /[a-z]/.test(p),
  (p: string) => /\d/.test(p),
  (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();
  const { lang, setLang } = useLangStore();
  const c = content[lang];
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordValid = passwordTests.every((t) => t(form.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) { toast.error('Password does not meet requirements.'); return; }
    setLoading(true);
    try {
      const { data } = await api.auth.register(form);
      setAuth({ user_id: data.user_id, email: data.email, subscription_tier: data.subscription_tier }, data.access_token);
      toast.success(c.successMsg);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || c.errorMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-void-900 flex items-center justify-center px-4 py-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 bg-cosmos opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

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
          <h1 className="font-display font-bold text-2xl">{c.title}</h1>
          <p className="text-white/40 text-sm mt-1">{c.sub}</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{c.name}</label>
              <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                placeholder={c.namePlaceholder} />
            </div>
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
              {form.password && (
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {c.rules.map((label, i) => {
                    const ok = passwordTests[i](form.password);
                    return (
                      <div key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-threat-low' : 'text-white/30'}`}>
                        {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading || !passwordValid}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sovereign mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{c.loading}</> : c.submit}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              {c.hasAccount}{' '}
              <Link href="/login" className="text-sovereign-400 hover:text-sovereign-300 font-medium">{c.signIn}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
