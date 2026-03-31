import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon; label: string; value: number | string;
  color?: string; urgent?: boolean; isText?: boolean;
}

const colorMap: Record<string, string> = {
  sovereign: 'text-sovereign-400 bg-sovereign-600/10',
  critical:  'text-threat-critical bg-[#ff2d55]/10',
  high:      'text-threat-high bg-[#ff6b35]/10',
  medium:    'text-threat-medium bg-[#ffcc00]/10',
  low:       'text-threat-low bg-[#34c759]/10',
  info:      'text-[#5ac8fa] bg-[#5ac8fa]/10',
};

export default function StatCard({ icon: Icon, label, value, color = 'sovereign', urgent, isText }: Props) {
  const cls = colorMap[color] ?? colorMap.sovereign;

  return (
    <div className={`glass-card p-4 ${urgent ? 'border-threat-critical/30' : ''}`}>
      <div className={`w-8 h-8 rounded-lg ${cls} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className={`font-display font-bold ${isText ? 'text-xl' : 'text-2xl'} ${urgent ? 'text-threat-critical' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}
