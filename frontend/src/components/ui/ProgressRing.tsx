// src/components/ui/ProgressRing.tsx
import { cn } from '@/lib/utils';

type RingColor = 'cyan' | 'magenta' | 'violet' | 'green' | 'amber' | 'red';

interface ProgressRingProps {
  value: number;      // 0–100
  size?: number;      // px
  strokeWidth?: number;
  color?: RingColor;
  showLabel?: boolean;
  label?: string;
  animating?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const tokenMap: Record<RingColor, string> = {
  cyan: 'brand', magenta: 'clay', violet: 'plum', green: 'green', amber: 'amber', red: 'red',
};

const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 6,
  color = 'cyan',
  showLabel = true,
  label,
  className,
  children,
}: ProgressRingProps) => {
  const radius        = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct           = Math.min(Math.max(value, 0), 100);
  const offset        = circumference - (pct / 100) * circumference;
  const token         = tokenMap[color];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} fill="none"
          style={{ stroke: 'rgb(var(--ink) / .08)' }}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            stroke: `rgb(var(--${token}))`,
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2, 0.7, 0.2, 1)',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          showLabel && (
            <>
              <span className={cn('leading-none text-ink tabular', size >= 110 ? 'font-display' : 'font-mono font-bold')} style={{ fontSize: size * 0.22 }}>
                {Math.round(pct)}<span className="text-ink/45" style={{ fontSize: size * 0.12 }}>%</span>
              </span>
              {label && (
                <span className="text-ink/50 mt-1" style={{ fontSize: Math.max(11, size * 0.09) }}>
                  {label}
                </span>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
