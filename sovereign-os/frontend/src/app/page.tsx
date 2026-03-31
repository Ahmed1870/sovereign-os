import Link from 'next/link';
import { Shield, Radar, Zap, Lock, Eye, Trash2, ChevronRight, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void-900 overflow-hidden">
      {/* Background cosmos */}
      <div className="fixed inset-0 bg-cosmos opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            '--duration': `${Math.random() * 8 + 4}s`,
            '--delay': `${Math.random() * 4}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sovereign-600 flex items-center justify-center shadow-sovereign animate-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Sovereign OS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-sovereign text-sm py-2 px-5"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sovereign-600/10 border border-sovereign-600/30 text-sovereign-300 text-sm font-medium mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-sovereign-400 animate-pulse" />
          Zero-Knowledge Architecture · Military-Grade Encryption
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-6xl md:text-7xl lg:text-8xl leading-none mb-6 max-w-5xl animate-fade-in-up">
          Reclaim Your{' '}
          <span className="gradient-text text-glow">Digital Sovereignty</span>
        </h1>

        <p className="text-white/50 text-xl max-w-2xl mb-10 leading-relaxed animate-fade-in-up">
          Your autonomous digital bodyguard. Scan breaches, monitor your footprint,
          detect SIM swaps, and auto-clean your data — all encrypted, all private.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up">
          <Link
            href="/register"
            className="flex items-center gap-2 px-8 py-4 bg-sovereign-600 hover:bg-sovereign-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-sovereign hover:shadow-lg group"
          >
            Start Free Scan
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            View Demo
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-20 text-center">
          {[
            { value: '50+', label: 'Platforms Scanned' },
            { value: '9', label: 'Data Brokers Covered' },
            { value: '100%', label: 'Zero-Knowledge' },
          ].map((stat) => (
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
          <h2 className="font-display font-bold text-4xl mb-4">
            Four Shields. One Platform.
          </h2>
          <p className="text-white/40 text-lg">Everything you need to protect your digital identity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Radar,
              color: 'sovereign',
              title: 'Identity Radar',
              subtitle: 'OSINT Engine',
              description: 'Scan 50+ platforms for your username, detect data breaches with k-anonymity, and get a live Security Health Score.',
              features: ['Username footprint mapping', 'HIBP breach detection', 'Real-time security scoring'],
            },
            {
              icon: Shield,
              color: 'threat-critical',
              title: 'SIM & Device Monitor',
              subtitle: 'Integrity Scanner',
              description: 'Detect SIM swap attacks via HLR lookups, check for unauthorized call forwarding, and audit active account sessions.',
              features: ['HLR lookup (SIM swap detection)', 'USSD call forwarding guide', 'Active session audit links'],
            },
            {
              icon: Trash2,
              color: 'threat-medium',
              title: 'Shadow Cleaner',
              subtitle: 'Privacy Governor',
              description: 'Auto-generate GDPR/CCPA deletion emails for 9 data brokers. AI-powered alerts summarize your risks in plain language.',
              features: ['GDPR Article 17 request drafts', 'CCPA deletion automation', 'AI security summaries'],
            },
            {
              icon: Lock,
              color: 'threat-low',
              title: 'Zero-Knowledge Vault',
              subtitle: 'AES-256 Encryption',
              description: 'Your data is encrypted with your own key — we cannot see it. Multi-tenant RLS ensures complete isolation.',
              features: ['AES-256-GCM encryption', 'Supabase RLS isolation', 'Client-side key derivation'],
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-card p-8 group hover:border-sovereign-600/30 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl bg-sovereign-600/10 flex items-center justify-center mb-6`}>
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
          <h2 className="font-display font-bold text-4xl mb-4">Simple, Transparent Pricing</h2>
          <p className="text-white/40 text-lg">Start free. Upgrade when you need more power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="glass-card p-8">
            <div className="text-sm font-mono text-white/40 mb-2">FREE</div>
            <div className="font-display font-bold text-4xl mb-1">$0</div>
            <div className="text-white/40 text-sm mb-8">Forever free</div>
            <ul className="space-y-3 mb-8">
              {['10 scans / hour', '3 full identity scans / hour', 'Breach checker', 'GDPR request generator (9 brokers)', 'SIM check guidance', 'Security Health Score'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="text-threat-low">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all">
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="glass-card p-8 border-sovereign-600/40 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-sovereign-600 text-white text-xs font-bold rounded-full">POPULAR</span>
            </div>
            <div className="text-sm font-mono text-sovereign-400 mb-2">PRO</div>
            <div className="font-display font-bold text-4xl mb-1 gradient-text">$9</div>
            <div className="text-white/40 text-sm mb-8">per month</div>
            <ul className="space-y-3 mb-8">
              {['100 scans / hour', '30 full identity scans / hour', 'All Free features', 'AI-powered security summaries', 'Automated GDPR email sending', 'Priority support', 'Scan history & reports'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="text-sovereign-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="btn-sovereign block w-full text-center py-3 text-sm">
              Start Pro Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 max-w-7xl mx-auto flex items-center justify-between text-white/30 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sovereign-600" />
          <span>Sovereign OS © 2024</span>
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
