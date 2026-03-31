'use client';
import { useState } from 'react';
import { Trash2, Loader2, Copy, Check, Globe, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type GDPRRequest = {
  broker_name: string; broker_id: string; email_subject: string;
  email_body: string; opt_out_url: string; privacy_email: string;
  estimated_removal_days: number; legal_basis: string;
};

export default function PrivacyPage() {
  const [form, setForm] = useState({ full_name: '', email: '', location_code: '' });
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [selected, setSelected] = useState<GDPRRequest | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.privacy.generateGDPR({
        full_name: form.full_name,
        email: form.email,
        location_code: form.location_code || undefined,
      });
      setRequests(data);
      setSelected(data[0]);
      toast.success(`${data.length} deletion requests generated!`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Generation failed');
    } finally { setLoading(false); }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const openMailto = (req: GDPRRequest) => {
    const url = `mailto:${req.privacy_email}?subject=${encodeURIComponent(req.email_subject)}&body=${encodeURIComponent(req.email_body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-sovereign-400 mb-2 uppercase tracking-widest">
          <Trash2 className="w-3 h-3" /> Shadow Cleaner
        </div>
        <h1 className="font-display font-bold text-3xl">Privacy Governor</h1>
        <p className="text-white/40 mt-1">Generate GDPR / CCPA deletion requests for data brokers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 mb-4">
            <h2 className="font-semibold mb-4">Your Information</h2>
            <form onSubmit={generate} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Full Legal Name</label>
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                  placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Country Code (optional)</label>
                <input maxLength={2} value={form.location_code} onChange={e => setForm({ ...form, location_code: e.target.value.toUpperCase() })}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                  placeholder="US / DE / FR..." />
                <p className="text-xs text-white/30 mt-1">EU countries get GDPR requests, others get CCPA</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Trash2 className="w-4 h-4" />Generate Requests</>}
              </button>
            </form>
          </div>

          {/* Broker list */}
          {requests.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-white/70">
                {requests.length} Brokers Targeted
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {requests.map(req => (
                  <button key={req.broker_id} onClick={() => setSelected(req)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${selected?.broker_id === req.broker_id ? 'bg-sovereign-600/20 border border-sovereign-600/40 text-white' : 'hover:bg-white/5 text-white/60'}`}>
                    <div className="flex items-center justify-between">
                      <span>{req.broker_name}</span>
                      <span className="text-xs text-white/30">~{req.estimated_removal_days}d</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{selected.broker_name}</h2>
                <span className="text-xs px-2 py-1 bg-sovereign-600/20 text-sovereign-400 rounded-lg font-mono">{selected.legal_basis.split('(')[0].trim()}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button onClick={() => openMailto(selected)}
                  className="flex items-center gap-2 px-4 py-2 bg-sovereign-600/20 hover:bg-sovereign-600/30 border border-sovereign-600/30 text-sovereign-300 rounded-xl text-xs font-semibold transition-all">
                  <Mail className="w-3.5 h-3.5" /> Open in Mail App
                </button>
                <button onClick={() => window.open(selected.opt_out_url, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl text-xs font-semibold transition-all">
                  <Globe className="w-3.5 h-3.5" /> Online Opt-Out
                </button>
                <button onClick={() => copyText(`To: ${selected.privacy_email}\nSubject: ${selected.email_subject}\n\n${selected.email_body}`, selected.broker_id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl text-xs font-semibold transition-all">
                  {copied === selected.broker_id ? <Check className="w-3.5 h-3.5 text-threat-low" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Email
                </button>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <div className="text-xs text-white/40 mb-1.5">TO</div>
                <div className="font-mono text-sm text-sovereign-300 bg-void-700/40 px-3 py-2 rounded-lg">{selected.privacy_email}</div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-white/40 mb-1.5">SUBJECT</div>
                <div className="font-mono text-sm text-white/80 bg-void-700/40 px-3 py-2 rounded-lg">{selected.email_subject}</div>
              </div>

              {/* Body */}
              <div>
                <div className="text-xs text-white/40 mb-1.5">EMAIL BODY</div>
                <pre className="text-xs text-white/60 bg-void-700/40 p-4 rounded-xl overflow-auto max-h-72 whitespace-pre-wrap font-mono leading-relaxed border border-white/5">
                  {selected.email_body}
                </pre>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center justify-center h-full text-center min-h-64">
              <Trash2 className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/30 text-sm">Fill in the form and generate requests to see email drafts here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
