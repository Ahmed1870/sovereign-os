'use client';
import { useState } from 'react';
import { Radar, Search, Mail, Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type ScanResult = { platform: string; found: boolean; profile_url?: string; risk_level: string; details?: any };
type BreachResult = { source: string; breach_date?: string; data_classes: string[]; risk_level: string; description?: string };

const riskColor: Record<string, string> = {
  critical: 'threat-critical', high: 'threat-high', medium: 'threat-medium', low: 'threat-low', info: 'threat-info',
};

export default function ScanPage() {
  const [tab, setTab] = useState<'username' | 'email'>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformResults, setPlatformResults] = useState<ScanResult[]>([]);
  const [breachResults, setBreachResults] = useState<BreachResult[]>([]);
  const [scanned, setScanned] = useState(false);

  const scanUsername = async () => {
    if (!username.trim()) return;
    setLoading(true); setScanned(false); setPlatformResults([]);
    try {
      const { data } = await api.scan.username({ username });
      setPlatformResults(data);
      setScanned(true);
      const found = data.filter((r: ScanResult) => r.found).length;
      toast.success(`Scan complete — ${found} profiles found across ${data.length} platforms`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Scan failed');
    } finally { setLoading(false); }
  };

  const scanEmail = async () => {
    if (!email.trim()) return;
    setLoading(true); setScanned(false); setBreachResults([]);
    try {
      const { data } = await api.scan.email({ email, check_breaches: true });
      setBreachResults(data);
      setScanned(true);
      if (data.length === 0) toast.success('No breaches found for this email! ✓');
      else toast.error(`${data.length} breach(es) detected!`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Breach check failed');
    } finally { setLoading(false); }
  };

  const foundPlatforms = platformResults.filter(r => r.found);
  const notFoundPlatforms = platformResults.filter(r => !r.found);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-sovereign-400 mb-2 uppercase tracking-widest">
          <Radar className="w-3 h-3" /> Identity Radar
        </div>
        <h1 className="font-display font-bold text-3xl">OSINT Scanner</h1>
        <p className="text-white/40 mt-1">Scan your digital footprint across platforms and breach databases</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['username', 'email'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-sovereign-600 text-white shadow-sovereign' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            {t === 'username' ? '🔍 Username Scan' : '📧 Breach Check'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6">
        {tab === 'username' ? (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanUsername()}
                className="w-full bg-void-700/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                placeholder="Enter username (e.g. johndoe)" />
            </div>
            <button onClick={scanUsername} disabled={loading || !username.trim()}
              className="px-6 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanEmail()}
                type="email"
                className="w-full bg-void-700/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sovereign-500 transition-all"
                placeholder="your@email.com" />
            </div>
            <button onClick={scanEmail} disabled={loading || !email.trim()}
              className="px-6 py-3 bg-sovereign-600 hover:bg-sovereign-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Checking...' : 'Check Breaches'}
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-sovereign-400 mb-2">
              <span className="animate-pulse">▶</span> SCANNING TARGETS...
            </div>
            <div className="h-1 bg-void-700 rounded-full overflow-hidden">
              <div className="h-full bg-sovereign-600 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Username Results */}
      {tab === 'username' && scanned && platformResults.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Profiles Found', value: foundPlatforms.length, color: 'text-threat-high' },
              { label: 'Not Found', value: notFoundPlatforms.length, color: 'text-threat-low' },
              { label: 'High Risk', value: foundPlatforms.filter(r => ['high','critical'].includes(r.risk_level)).length, color: 'text-threat-critical' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Found platforms */}
          {foundPlatforms.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 text-sm">Found Profiles ({foundPlatforms.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {foundPlatforms.map(r => (
                  <div key={r.platform} className="flex items-center justify-between p-3 bg-void-700/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-threat-high" />
                      <div>
                        <div className="text-sm font-medium capitalize">{r.platform}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${riskColor[r.risk_level] ? `threat-${r.risk_level}` : ''}`}>
                          {r.risk_level}
                        </span>
                      </div>
                    </div>
                    {r.profile_url && (
                      <a href={r.profile_url} target="_blank" rel="noopener noreferrer"
                        className="text-sovereign-400 hover:text-sovereign-300 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breach Results */}
      {tab === 'email' && scanned && (
        <div className="space-y-4">
          {breachResults.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CheckCircle className="w-12 h-12 text-threat-low mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Breaches Found</h3>
              <p className="text-white/40 text-sm">This email has not appeared in any known data breaches.</p>
            </div>
          ) : (
            <>
              <div className="glass-card p-4 border border-threat-critical/30 bg-threat-critical/5">
                <div className="flex items-center gap-2 text-threat-critical font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {breachResults.length} breach(es) detected — change your passwords immediately
                </div>
              </div>
              {breachResults.map(b => (
                <div key={b.source} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{b.source}</h3>
                      {b.breach_date && <p className="text-white/40 text-xs mt-0.5">Breach date: {b.breach_date}</p>}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium threat-${b.risk_level}`}>
                      {b.risk_level.toUpperCase()}
                    </span>
                  </div>
                  {b.data_classes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {b.data_classes.map(dc => (
                        <span key={dc} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/60">{dc}</span>
                      ))}
                    </div>
                  )}
                  {b.description && <p className="text-white/40 text-xs leading-relaxed">{b.description.slice(0, 150)}...</p>}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
