// src/components/ui/ThemeToggle.tsx
import { useThemeStore } from '@/store/themeStore';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/** Light / dark switch. Colours come from theme tokens, so it needs no per-theme styles. */
export default function ThemeToggle({ className, size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';

  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17;
  const box = size === 'sm' ? 'h-8 min-w-8 px-2' : size === 'lg' ? 'h-11 min-w-11 px-3' : 'h-9 min-w-9 px-2.5';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface',
        'text-ink/65 hover:text-ink hover:border-ink/30 transition-colors',
        box,
        className
      )}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
      {showLabel && <span className="text-sm">{isLight ? 'Dark' : 'Light'}</span>}
    </button>
  );
}
