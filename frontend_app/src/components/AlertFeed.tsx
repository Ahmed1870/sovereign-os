import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert { id: string; title: string; severity: string; created_at: string; description?: string; }

const severityConfig: Record<string, { icon: any; className: string }> = {
  critical: { icon: AlertTriangle, className: 'text-threat-critical' },
  high:     { icon: AlertTriangle, className: 'text-threat-high' },
  medium:   { icon: Info,          className: 'text-threat-medium' },
  low:      { icon: CheckCircle,   className: 'text-threat-low' },
  info:     { icon: Info,          className: 'text-[#5ac8fa]' },
};

export default function AlertFeed({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle className="w-10 h-10 text-threat-low/40 mb-3" />
        <p className="text-white/30 text-sm">No alerts. Your digital perimeter is clear.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const cfg = severityConfig[alert.severity] ?? severityConfig.info;
        const Icon = cfg.icon;
        return (
          <div key={alert.id} className="flex items-start gap-3 p-4 bg-void-700/30 rounded-xl border border-white/[0.04] hover:border-white/10 transition-all">
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.className}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{alert.title}</div>
              {alert.description && <p className="text-white/40 text-xs mt-0.5">{alert.description}</p>}
            </div>
            <div className="text-xs text-white/25 flex-shrink-0">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
