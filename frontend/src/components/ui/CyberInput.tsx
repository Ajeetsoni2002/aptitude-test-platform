// src/components/ui/CyberInput.tsx
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  icon?:        ReactNode;
  rightIcon?:   ReactNode;
  helperText?:  string;
}

const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, error, icon, rightIcon, helperText, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-ink/75">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-ink/40 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            {...props}
            className={cn(
              'cyber-input w-full h-11 text-[15px] px-3.5',
              icon      && 'pl-10',
              rightIcon && 'pr-10',
              error && '!border-bad focus:!shadow-[0_0_0_3px_rgb(var(--red)/0.15)]',
              className
            )}
          />

          {rightIcon && (
            <div className="absolute right-3 text-ink/45 flex items-center z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-bad text-[13px]">{error}</p>}
        {helperText && !error && <p className="text-ink/50 text-[13px]">{helperText}</p>}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';
export default CyberInput;
