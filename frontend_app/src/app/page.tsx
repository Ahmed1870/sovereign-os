'use client';
import Link from 'next/link';
import { Shield, Radar, Trash2, Lock, Eye, ChevronRight, Languages } from 'lucide-react';
import { useLangStore } from '@/lib/store';

const content = {
  en: {
    badge: "Zero-Knowledge Architecture · Military-Grade Encryption",
    headline1: "Reclaim Your",
    headline2: "Digital Sovereignty",
    sub: "Your autonomous digital bodyguard. Scan breaches, monitor your footprint, detect SIM swaps, and auto-clean your data — all encrypted, all private.",
    cta1: "Start Free Scan",
    cta2: "View Demo",
    stats: [
      { value: '50+', label: 'Platforms Scanned' },
      { value: '9', label: 'Data Brokers Covered' },
      { value: '100%', label: 'Zero-Knowledge' },
    ],
    featuresTitle: "Four Shields. One Platform.",
    featuresSub: "Everything you need to protect your digital identity.",
    pricingTitle: "Simple, Transparent Pricing",
    pricingSub: "Start free. Upgrade when you need more power.",
    signIn: "Sign In",
    getStarted: "Get Started Free",
    freeLabel: "FREE",
    proLabel: "PRO",
    forever: "Forever free",
    perMonth: "per month",
    popular: "POPULAR",
    startFree: "Get Started",
    startPro: "Start Pro Trial",
    footer: "Sovereign OS © 2024",
    privacy: "Privacy Policy",
    terms: "Terms",
  },
  ar: {
    badge: "معمارية صفر معرفة · تشفير عسكري المستوى",
    headline1: "استعد",
    headline2: "سيادتك الرقمية",
    sub: "حارسك الرقمي المستقل. افحص الاختراقات، راقب بصمتك، اكتشف سرقة الشريحة، ونظّف بياناتك تلقائياً — كل شيء مشفر وخاص.",
    cta1: "ابدأ الفحص المجاني",
    cta2: "عرض توضيحي",
    stats: [
      { value: '+50', label: 'منصة تم فحصها' },
      { value: '9', label: 'وسيط بيانات مغطى' },
      { value: '100%', label: 'صفر معرفة' },
    ],
    featuresTitle: "أربع دروع. منصة واحدة.",
    featuresSub: "كل ما تحتاجه لحماية هويتك الرقمية.",
    pricingTitle: "أسعار بسيطة وشفافة",
    pricingSub: "ابدأ مجاناً. طوّر عندما تحتاج مزيداً.",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ مجاناً",
    freeLabel: "مجاني",
    proLabel: "برو",
    forever: "مجاني للأبد",
    perMonth: "شهرياً",
    popular: "الأكثر شعبية",
    startFree: "ابدأ الآن",
    startPro: "ابدأ تجربة برو",
    footer: "Sovereign OS © 2024",
    privacy: "سياسة الخصوصية",
    terms: "الشروط",
  },
};

const features = {
  en: [
    { icon: Radar, title: 'Identity Radar', subtitle: 'OSINT Engine', description: 'Scan 50+ platforms for your username, detect data breaches with k-anonymity, and get a live Security Health Score.', features: ['Username footprint mapping', 'HIBP breach detection', 'Real-time security scoring'] },
    { icon: Shield, title: 'SIM & Device Monitor', subtitle: 'Integrity Scanner', description: 'Detect SIM swap attacks via HLR lookups, check for unauthorized call forwarding, and audit active account sessions.', features: ['HLR lookup (SIM swap detection)', 'USSD call forwarding guide', 'Active session audit links'] },
    { icon: Trash2, title: 'Shadow Cleaner', subtitle: 'Privacy Governor', description: 'Auto-generate GDPR/CCPA deletion emails for 9 data brokers. AI-powered alerts summarize your risks in plain language.', features: ['GDPR Article 17 request drafts', 'CCPA deletion automation', 'AI security summaries'] },
    { icon: Lock, title: 'Zero-Knowledge Vault', subtitle: 'AES-256 Encryption', description: 'Your data is encrypted with your own key — we cannot see it. Multi-tenant RLS ensures complete isolation.', features: ['AES-256-GCM encryption', 'Supabase RLS isolation', 'Client-side key derivation'] },
  ],
  ar: [
    { icon: Radar, title: 'رادار الهوية', subtitle: 'محرك OSINT', description: 'افحص أكثر من 50 منصة، اكتشف اختراقات البيانات، واحصل على درجة أمان مباشرة.', features: ['رسم خريطة البصمة الرقمية', 'كشف اختراقات HIBP', 'تقييم الأمان الفوري'] },
    { icon: Shield, title: 'مراقب الجهاز والشريحة', subtitle: 'فاحص السلامة', description: 'اكتشف هجمات سرقة الشريحة، افحص إعادة توجيه المكالمات، وراجع جلسات الحساب النشطة.', features: ['بحث HLR لكشف سرقة الشريحة', 'دليل رموز USSD', 'روابط مراجعة الجلسات'] },
    { icon: Trash2, title: 'منظف الظل', subtitle: 'حاكم الخصوصية', description: 'توليد تلقائي لطلبات حذف GDPR/CCPA لـ 9 وسطاء بيانات. ملخصات مخاطر مدعومة بالذكاء الاصطناعي.', features: ['مسودات طلب المادة 17 GDPR', 'أتمتة حذف CCPA', 'ملخصات أمان بالذكاء الاصطناعي'] },
    { icon: Lock, title: 'خزنة صفر المعرفة', subtitle: 'تشفير AES-256', description: 'بياناتك مشفرة بمفتاحك الخاص — لا يمكننا رؤيتها. RLS متعدد المستأجرين يضمن العزل الكامل.', features: ['تشفير AES-256-GCM', 'عزل Supabase RLS', 'اشتقاق المفتاح من جهة العميل'] },
  ],
};

const freePlan = {
  en: ['10 scans / hour', '3 full identity scans / hour', 'Breach checker', 'GDPR request generator (9 brokers)', 'SIM check guidance', 'Security Health Score'],
  ar: ['10 فحوصات / ساعة', '3 فحوصات هوية كاملة / ساعة', 'فاحص الاختراقات', 'مولد طلبات GDPR (9 وسطاء)', 'دليل فحص الشريحة', 'درجة الصحة الأمنية'],
};

const proPlan = {
  en: ['100 scans / hour', '30 full identity scans / hour', 'All Free features', 'AI-powered security summaries', 'Automated GDPR email sending', 'Priority support', 'Scan history & reports'],
  ar: ['100 فحص / ساعة', '30 فحص هوية كامل / ساعة', 'جميع المميزات المجانية', 'ملخصات أمان بالذكاء الاصطناعي', 'إرسال بريد GDPR تلقائي', 'دعم أولوية', 'سجل الفحوصات والتقارير'],
};

export default function LandingPage() {
  const { lang, setLang } = useLangStore();
  const c = content[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-void-900 overflow-hidden" dir={dir}>
      <div className="fixed inset-0 bg-cosmos opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sovereign-600 flex items-center justify-center shadow-sovereign animate-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Sovereign OS</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm transition-all"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            {c.signIn}
          </Link>
          <Link href="/register" className="btn-sovereign text-sm py-2 px-5">
            {c.getStarted}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sovereign-600/10 border border-sovereign-600/30 text-sovereign-300 text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sovereign-400 animate-pulse" />
          {c.badge}
        </div>
        <h1 className="font-display font-bold text-6xl md:text-7xl leading-none mb-6 max-w-5xl">
          {c.headline1}{' '}
          <span className="gradient-text text-glow">{c.headline2}</span>
        </h1>
        <p className="text-white/50 text-xl max-w-2xl mb-10 leading-relaxed">{c.sub}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="flex items-center gap-2 px-8 py-4 bg-sovereign-600 hover:bg-sovereign-500 text-white font-semibold rounded-xl transition-all shadow-sovereign group">
            {c.cta1}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all">
            <Eye className="w-4 h-4" />
            {c.cta2}
          </Link>
        </div>
        <div className="flex gap-12 mt-20 text-center">
          {c.stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-bold text-3xl gradient-text">{stat.value}</div>
              <div className="text-white/40 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl mb-4">{c.featuresTitle}</h2>
          <p className="text-white/40 text-lg">{c.featuresSub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features[lang].map((feature) => (
            <div key={feature.title} className="glass-card p-8 hover:border-sovereign-600/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-sovereign-600/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-sovereign-400" />
              </div>
              <div className="text-xs font-mono text-sovereign-400 mb-2 uppercase tracking-widest">{feature.subtitle}</div>
              <h3 className="font-display font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm mb-5 leading-relaxed">{feature.description}</p>
              <ul className="space-y-2">
                {feature.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-sovereign-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl mb-4">{c.pricingTitle}</h2>
          <p className="text-white/40 text-lg">{c.pricingSub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-8">
            <div className="text-sm font-mono text-white/40 mb-2">{c.freeLabel}</div>
            <div className="font-display font-bold text-4xl mb-1">$0</div>
            <div className="text-white/40 text-sm mb-8">{c.forever}</div>
            <ul className="space-y-3 mb-8">
              {freePlan[lang].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="text-threat-low">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all">
              {c.startFree}
            </Link>
          </div>
          <div className="glass-card p-8 border-sovereign-600/40 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-sovereign-600 text-white text-xs font-bold rounded-full">{c.popular}</span>
            </div>
            <div className="text-sm font-mono text-sovereign-400 mb-2">{c.proLabel}</div>
            <div className="font-display font-bold text-4xl mb-1 gradient-text">$9</div>
            <div className="text-white/40 text-sm mb-8">{c.perMonth}</div>
            <ul className="space-y-3 mb-8">
              {proPlan[lang].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="text-sovereign-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-sovereign block w-full text-center py-3 text-sm">
              {c.startPro}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 max-w-7xl mx-auto flex items-center justify-between text-white/30 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sovereign-600" />
          <span>{c.footer}</span>
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">{c.privacy}</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">{c.terms}</Link>
        </div>
      </footer>
    </div>
  );
}
