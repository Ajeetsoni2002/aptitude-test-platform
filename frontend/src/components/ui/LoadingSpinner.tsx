// src/components/ui/LoadingSpinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeMap = { sm: 18, md: 28, lg: 40, xl: 56 };

const LoadingSpinner = ({ size = 'md', className, label }: LoadingSpinnerProps) => {
  const px = sizeMap[size];
  const stroke = size === 'sm' ? 2.5 : 3;
  const r = (px - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status">
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="animate-ring-spin">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgb(var(--ink) / .12)" />
        <circle
          cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke}
          stroke="rgb(var(--brand))" strokeLinecap="round"
          strokeDasharray={`${c * 0.28} ${c}`}
        />
      </svg>
      {label ? <p className="text-ink/55 text-sm">{label}</p> : <span className="sr-only">Loading</span>}
    </div>
  );
};

export default LoadingSpinner;
