'use client';
import { useState } from 'react';
import { Smartphone, Loader2, AlertTriangle, CheckCircle, ExternalLink, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DevicePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);

  const checkSIM = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const { data } = await api.device.simCheck(phone);
      setResult(data);
      if (data.threat_level === 'suspicious' || data.threat_level === 'critical') {
        toast.error('⚠️ Suspicious indicators detected!');
      } else {
        toast.success('SIM check complete');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Check failed');
    } finally { setLoading(false); }
  };

  const loadGuide = async () => {
    try {
      const { data } = await api.device.sessionGuide();
      setGuide(data);
    } catch { toast.error('Failed to load session guide'); }
  };

  const threatColor = (level: string) => {
    if (level === 'critical' || level === 'suspicious') return 'text-threat-critical';
    if (level === 'normal') return 'text-threat-low';
    return 'text-white/40';
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-sovereign-400 mb-2 uppercase tracking-widest">
          <Smartphone className="w-3 h-3" /> Device Monitor
        </div>
        <h1 className="font-display font-bold text-3xl">SIM & Session Integrity</h1>
        <p className="text-white/40 mt-1">Detect SIM swap attacks, call forwarding, and unauthorized sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SIM Check */}
        <div>
          <div className="glass-card p-6 mb-4">
            <h2 className="font-semibold mb-1">SIM Integrity Check</h2>
            <p className="text-white/40 text-xs mb-5">Detect SIM swap indicators via HLR lookup</p>
            <form onSubmit={checkSIM} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Phone Number (with country code)</label>
                <input required value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-void-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                  placeholder="+1 555 000 0000" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Checking...</> : <><Smartphone className="w-4 h-4" />Check SIM</>}
              </button>
            </form>
          </div>

          {result && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                {result.threat_level === 'normal'
                  ? <CheckCircle className="w-6 h-6 text-threat-low" />
                  : <AlertTriangle className="w-6 h-6 text-threat-critical" />}
                <div>
                  <div className={`font-semibold ${threatColor(result.threat_level)}`}>
                    {result.threat_level.toUpperCase()}
                  </div>
                  <div className="text-white/40 text-xs">SIM Status</div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {result.network && <div className="flex justify-between"><span className="text-white/40">Network</span><span>{result.network}</span></div>}
                {result.country && <div className="flex justify-between"><span className="text-white/40">Country</span><span>{result.country}</span></div>}
                {result.ported !== null && result.ported !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Number Ported</span>
                    <span className={result.ported ? 'text-threat-critical' : 'text-threat-low'}>{result.ported ? '⚠ YES' : '✓ NO'}</span>
                  </div>
                )}
                {result.roaming !== null && result.roaming !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Roaming</span>
                    <span className={result.roaming ? 'text-threat-medium' : 'text-threat-low'}>{result.roaming ? 'YES' : 'NO'}</span>
                  </div>
                )}
              </div>

              {result.indicators?.length > 0 && (
                <div className="space-y-1.5">
                  {result.indicators.map((ind: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-threat-high bg-threat-high/5 border border-threat-high/20 px-3 py-2 rounded-lg">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {ind}
                    </div>
                  ))}
                </div>
              )}

              {result.ussd_guidance && (
                <div className="mt-4 p-3 bg-void-700/40 rounded-xl border border-white/5">
                  <div className="text-xs font-mono text-sovereign-400 mb-2">USSD CODES FOR YOUR CARRIER</div>
                  {Object.entries(result.ussd_guidance.codes || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs mb-1">
                      <span className="text-white/40">{k.replace(/_/g, ' ')}</span>
                      <code className="text-sovereign-300 font-mono">{v as string}</code>
                    </div>
                  ))}
                </div>
              )}

              {result.error && (
                <p className="text-xs text-white/30 mt-2">Note: {result.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Session Guide */}
        <div>
          <div className="glass-card p-6 mb-4">
            <h2 className="font-semibold mb-1">Active Sessions Audit</h2>
            <p className="text-white/40 text-xs mb-5">Check authorized sessions on major platforms</p>
            <button onClick={loadGuide}
              className="w-full flex items-center justify-center gap-2 py-3 bg-void-700/50 hover:bg-void-600/50 border border-white/10 hover:border-sovereign-600/30 text-white font-semibold rounded-xl transition-all text-sm">
              <Shield className="w-4 h-4" /> Load Session Guide
            </button>
          </div>

          {guide ? (
            <div className="glass-card p-5 space-y-4">
              {Object.entries(guide.providers || {}).map(([key, prov]: [string, any]) => (
                <div key={key} className="p-4 bg-void-700/40 rounded-xl border border-white/5">
                  <div className="font-semibold capitalize mb-3">{key}</div>
                  <div className="space-y-1.5 mb-3">
                    {prov.instructions?.map((inst: string, i: number) => (
                      <p key={i} className="text-xs text-white/50">{inst}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prov.sessions_url && (
                      <a href={prov.sessions_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-sovereign-400 hover:text-sovereign-300 transition-colors">
                        <ExternalLink className="w-3 h-3" /> View Sessions
                      </a>
                    )}
                    {prov.connected_apps && (
                      <a href={prov.connected_apps} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-sovereign-400 hover:text-sovereign-300 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Connected Apps
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <Smartphone className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Click "Load Session Guide" to see direct links for auditing your active sessions on Google, Meta, Apple, and Microsoft.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
