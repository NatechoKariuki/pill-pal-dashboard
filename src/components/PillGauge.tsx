import { useMemo } from "react";

interface PillGaugeProps {
  remaining: number;
  total?: number;
}

const PillGauge = ({ remaining, total = 30 }: PillGaugeProps) => {
  const percentage = useMemo(() => Math.min(100, Math.max(0, (remaining / total) * 100)), [remaining, total]);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage > 50 ? "hsl(var(--success))" : percentage > 20 ? "hsl(var(--warning))" : "hsl(var(--danger))";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold text-foreground">{remaining}</span>
          <span className="text-xs text-muted-foreground">of {total}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">Pills Remaining</p>
    </div>
  );
};

export default PillGauge;
