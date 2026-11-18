// frontend/src/pages/NotFoundPage.tsx
// 404 page, shown for any URL that doesn't match a route.

import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/brand/BrandMark';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark to="/" size="sm" />
        <ThemeToggle size="sm" />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-[460px] text-center section-enter">
          <p className="font-mono text-[13px] text-ink/50">Error 404</p>
          <h1 className="mt-3 font-display text-[32px] font-semibold leading-tight tracking-tight md:text-[40px]">
            We couldn&apos;t find that page
          </h1>
          <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-relaxed text-ink/60">
            The link may be out of date, or there may be a typo in the address.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="btn-holo-cyan inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[15px]"
            >
              Go to your dashboard
            </Link>
            <Link
              to="/"
              className="btn-ghost-neon inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[15px]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
