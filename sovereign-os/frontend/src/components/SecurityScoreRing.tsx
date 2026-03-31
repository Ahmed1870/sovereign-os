'use client';

interface Props { score: number; grade: string; status: string; }

const gradeColor: Record<string, string> = {
  A: '#34c759', B: '#5ac8fa', C: '#ffcc00', D: '#ff6b35', F: '#ff2d55',
};

export default function SecurityScoreRing({ score, grade, status }: Props) {
  const color = gradeColor[grade] ?? '#3670f8';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-3xl" style={{ color }}>{score}</span>
          <span className="text-xs text-white/40 mt-0.5">/100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="font-display font-bold text-lg" style={{ color }}>Grade {grade}</div>
        <div className="text-white/40 text-xs mt-0.5">{status}</div>
      </div>
    </div>
  );
}
