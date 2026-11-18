// src/components/layout/AppLayout.tsx
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import AIAssistant from '@/components/ui/AIAssistant';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Wordmark } from '@/components/brand/BrandMark';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  /** Pass true for pages that want full-screen (no padding, like Test page) */
  fullScreen?: boolean;
}

const COLLAPSE_KEY = 'apt_sidebar_collapsed';

const AppLayout = ({ children, className, fullScreen = false }: AppLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [collapsed,     setCollapsed]     = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });

  return (
    <div className="min-h-screen bg-canvas relative overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-coal/40 lg:hidden animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed left-0 top-0 h-screen z-40 lg:hidden animate-slide-in-left">
            <Sidebar isMobile onClose={() => setMobileNavOpen(false)} />
          </div>
        </>
      )}

      {/* Mobile top bar */}
      <header className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 gap-3',
        'border-b transition-colors bg-canvas/95 backdrop-blur',
        scrolled ? 'border-line' : 'border-transparent'
      )}>
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 rounded-lg border border-line bg-surface flex items-center justify-center text-ink/70 hover:text-ink"
        >
          <Menu size={18} />
        </button>
        <Wordmark to="/dashboard" size="sm" />
        <ThemeToggle size="sm" />
      </header>

      {/* Main content */}
      <main
        className={cn(
          'relative z-10 min-h-screen',
          'lg:transition-[padding] lg:duration-200',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]',
          !fullScreen && 'pt-14 lg:pt-0',
          className
        )}
      >
        {fullScreen ? children : (
          <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-9 max-w-[1320px] mx-auto">
            {children}
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
};

export default AppLayout;
