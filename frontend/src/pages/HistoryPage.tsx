// src/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResultsApi } from '@/api/testApi';
import type { TestAttempt } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts]   = useState<TestAttempt[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [page,     setPage]       = useState(1);
  const [total,    setTotal]      = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getMyResultsApi(page, perPage);
        if (res.success && res.data) {
          setAttempts(res.data.attempts);
          setTotal(res.data.pagination.totalAttempts);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [page]);

  const filtered = attempts.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-ok' : s >= 60 ? 'text-brand' : s >= 40 ? 'text-warn' : 'text-bad';
  const scoreBg = (s: number) =>
    s >= 80 ? 'bg-ok/10' : s >= 60 ? 'bg-brand/10' : s >= 40 ? 'bg-warn/10' : 'bg-bad/10';

  const totalPages = Math.ceil(total / perPage);

  return (
    <AppLayout>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">History</h1>
          <p className="text-[15px] text-ink/60 mt-1">
            {total > 0 ? `Every test you've taken, newest first. ${total} in total.` : "Every test you've taken, newest first."}
          </p>
        </div>
        <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')} icon={<Plus size={16} />}>
          New test
        </HoloButton>
      </header>

      <NeonCard padding="p-0" className="animate-fade-up overflow-hidden" hover={false}>
        {/* Search */}
        <div className="p-4 md:p-5 border-b border-line">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this page by title"
              className="cyber-input w-full h-10 pl-10 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-14 flex justify-center">
            <LoadingSpinner size="md" label="Loading your tests…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 px-6 flex flex-col items-center gap-3 text-center">
            <p className="text-ink/60 text-sm">
              {search ? `No tests on this page match “${search}”.` : 'No attempts yet. Your first test result will show up here.'}
            </p>
            {!search && (
              <HoloButton variant="ghost" size="sm" onClick={() => navigate('/test-setup')} icon={<Plus size={14} />}>
                Start a test
              </HoloButton>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-line bg-raised">
              {['#', 'Test', 'Date', 'Right', 'Wrong', 'Skipped', 'Score'].map((h, i) => (
                <p key={h} className={cn('label-caps',
                  i === 0 && 'col-span-1', i === 1 && 'col-span-4', i === 2 && 'col-span-2',
                  i === 3 && 'col-span-1 text-center', i === 4 && 'col-span-1 text-center',
                  i === 5 && 'col-span-1 text-center', i === 6 && 'col-span-2 text-right'
                )}>{h}</p>
              ))}
            </div>

            <ul className="divide-y divide-line">
              {filtered.map((a, i) => (
                <li
                  key={a._id}
                  className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-12 gap-x-4 gap-y-1 items-center px-4 sm:px-5 py-3.5 hover:bg-ink/[0.02] transition-colors"
                >
                  <span className="text-ink/40 font-mono text-xs sm:col-span-1">
                    {(page - 1) * perPage + i + 1}
                  </span>
                  <div className="sm:col-span-4 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.title}</p>
                    <p className="sm:hidden text-ink/50 text-xs mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}<span className="text-ok">{a.correctCount}</span> / <span className="text-bad">{a.incorrectCount}</span> / {a.skippedCount}
                    </p>
                  </div>
                  <p className="hidden sm:block sm:col-span-2 text-ink/55 text-[13px]">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <span className="hidden sm:block col-span-1 text-center text-ok text-sm font-mono">{a.correctCount}</span>
                  <span className="hidden sm:block col-span-1 text-center text-bad text-sm font-mono">{a.incorrectCount}</span>
                  <span className="hidden sm:block col-span-1 text-center text-ink/45 text-sm font-mono">{a.skippedCount}</span>
                  <div className="sm:col-span-2 flex justify-end">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-sm font-mono font-medium', scoreColor(a.score), scoreBg(a.score))}>
                      {a.score}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-line">
                <span className="text-ink/55 text-[13px] font-mono">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <HoloButton variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft size={14} />}>
                    Previous
                  </HoloButton>
                  <HoloButton variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight size={14} />
                  </HoloButton>
                </div>
              </div>
            )}
          </>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default HistoryPage;
