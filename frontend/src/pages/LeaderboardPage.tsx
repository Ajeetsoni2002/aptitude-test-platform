// src/pages/LeaderboardPage.tsx
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getLeaderboardApi } from '@/api/userApi';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  score: number;
  tests: number;
  badge: string;
  isCurrentUser?: boolean;
}

// ── Animated Counter Hook ────────────────────────────────────────
const useCountUp = (end: number, duration = 1400, start = true) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) { setCount(0); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, start]);

  return count;
};

// ── Circular Progress ring ───────────────────────────────────────
const CircularProgress = ({
  percentage, color, size = 52,
}: {
  percentage: number; color: string; size?: number;
}) => {
  const radius = 15.9;
  const circumference = 2 * Math.PI * radius;
  const [displayDash, setDisplayDash] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayDash((percentage / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx="18" cy="18" r={radius}
        fill="none" stroke="rgb(var(--ink) / .08)" strokeWidth="2.5"
      />
      <circle
        cx="18" cy="18" r={radius}
        fill="none" stroke={color}
        strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${displayDash} ${circumference - displayDash}`}
        strokeDashoffset="0"
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
    </svg>
  );
};

// ── Display helpers ──────────────────────────────────────────────
// The API still sends the old "Neural Master" tier name.
const badgeLabel = (badge: string) => (badge === 'Neural Master' ? 'Master' : badge);

const getBadgeStyle = (badge: string) => {
  if (badge === 'Neural Master') return 'bg-warn/10 text-warn';
  if (badge === 'Elite')         return 'bg-plum/10 text-plum';
  if (badge === 'Advanced')      return 'bg-brand/10 text-brand';
  if (badge === 'Proficient')    return 'bg-ok/10 text-ok';
  if (badge === 'Intermediate')  return 'bg-clay/10 text-clay';
  return 'bg-ink/[0.06] text-ink/60';
};

// Medal colours for the top three: gold, silver, bronze — as plain tokens.
const medalToken: Record<number, string> = { 1: 'amber', 2: 'z-400', 3: 'clay' };

const RankMark = ({ rank, large = false }: { rank: number; large?: boolean }) => {
  const token = medalToken[rank];
  if (!token) {
    return <span className="font-mono text-sm text-ink/50 tabular">{rank}</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-mono font-semibold tabular',
        large ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs'
      )}
      style={{
        background: `rgb(var(--${token}) / .14)`,
        color: `rgb(var(--${token}))`,
        boxShadow: `inset 0 0 0 1px rgb(var(--${token}) / .35)`,
      }}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
};

// ── Top-three card ───────────────────────────────────────────────
const PodiumCard = ({
  entry, animate, isMe,
}: {
  entry: LeaderboardEntry; animate: boolean; isMe: boolean;
}) => {
  const rank = entry.rank;
  const animatedScore = useCountUp(Math.round(entry.score), 1000, animate);

  return (
    <div
      className={cn(
        'neon-card p-5 h-full transition-[opacity,transform] duration-500',
        isMe && '!border-brand/45',
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      )}
      style={{ transitionDelay: `${(rank - 1) * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <RankMark rank={rank} large />
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getBadgeStyle(entry.badge))}>
          {badgeLabel(entry.badge)}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 min-w-0">
        <NeuralAvatar name={entry.name} size="md" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink truncate">
            {entry.name}
            {isMe && <span className="ml-1.5 text-xs font-medium text-brand">You</span>}
          </p>
          <p className="text-[13px] text-ink/55">
            {entry.tests} test{entry.tests !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-ink/50">Average score</p>
          <p className="font-display text-[36px] leading-none font-medium tracking-tight text-ink tabular mt-1">
            {animatedScore}<span className="text-ink/40 text-[22px]">%</span>
          </p>
        </div>
        <CircularProgress
          percentage={Math.round(entry.score)}
          color={`rgb(var(--${medalToken[rank] ?? 'brand'}))`}
          size={44}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
const LeaderboardPage = () => {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLeaderboardApi(50);

        if (response.success && response.data) {
          setLeaders(response.data.leaderboard);
        } else {
          setError(response.message || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Error loading leaderboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Trigger mount animations after data loads
  useEffect(() => {
    if (!isLoading && leaders.length > 0) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, leaders.length]);

  // Podium order: 2nd, 1st, 3rd
  const topThree = leaders.slice(0, 3).sort((a, b) => {
    if (a.rank === 2) return -1;
    if (b.rank === 2) return 1;
    if (a.rank === 1) return -1;
    return 1;
  });

  // Computed stats
  const totalParticipants = leaders.length;
  const totalTests = leaders.reduce((s, l) => s + l.tests, 0);
  const topScore = leaders.length > 0 ? Math.round(leaders[0]?.score ?? 0) : 0;
  const avgScore = leaders.length > 0
    ? Math.round(leaders.reduce((s, l) => s + l.score, 0) / leaders.length)
    : 0;

  const isMeEntry = (l: LeaderboardEntry) => Boolean(l.isCurrentUser || user?.name === l.name);
  const myEntry = leaders.find(isMeEntry);

  return (
    <AppLayout>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Leaderboard</h1>
          <p className="text-[15px] text-ink/60 mt-1">Students ranked by their average score across all tests.</p>
        </div>
        {!isLoading && !error && leaders.length > 0 && (
          <div className="text-[13px] text-ink/60 sm:text-right">
            {myEntry ? (
              <>You're <span className="font-display text-xl font-medium text-ink tabular mx-0.5">#{myEntry.rank}</span> of {totalParticipants}</>
            ) : (
              <>You're not in the top {totalParticipants} yet</>
            )}
          </div>
        )}
      </header>

      {/* ── Summary strip ─────────────────────────────────────── */}
      {!isLoading && !error && leaders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Students ranked', value: totalParticipants },
            { label: 'Tests completed', value: totalTests },
            { label: 'Top average', value: `${topScore}%` },
            { label: 'Group average', value: `${avgScore}%` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[12px] border border-line bg-surface px-4 py-3.5">
              <p className="text-[13px] text-ink/55">{stat.label}</p>
              <p className="font-display text-2xl font-medium text-ink tabular mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Top 3 ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="neon-card h-[188px] bg-raised" />
          ))}
        </div>
      ) : topThree.length >= 3 ? (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {topThree.map((entry) => (
            <div key={entry.userId} style={{ order: entry.rank - 1 }}>
              <PodiumCard entry={entry} animate={mounted} isMe={isMeEntry(entry)} />
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Rankings Table ─────────────────────────────────────── */}
      <NeonCard padding="p-0" className="overflow-hidden" hover={false}>
        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">All rankings</h2>
          {!isLoading && !error && leaders.length > 0 && (
            <span className="text-[13px] text-ink/50">Top {leaders.length}</span>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-3 m-4 md:m-5 p-4 rounded-[10px] bg-bad/10 border border-bad/25">
            <AlertCircle size={16} className="text-bad flex-shrink-0 mt-0.5" />
            <p className="text-bad text-sm">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading rankings…" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-ink/60 text-sm">No rankings yet. They appear once students start finishing tests.</p>
          </div>
        ) : (
          <>
            {/* Column heads */}
            <div className="hidden sm:flex items-center gap-4 px-4 md:px-5 py-2.5 bg-raised border-b border-line">
              <span className="label-caps w-8 text-center">#</span>
              <span className="label-caps flex-1">Student</span>
              <span className="label-caps w-28 text-right">Average</span>
            </div>
            <ol className="divide-y divide-line">
              {leaders.map((l, i) => {
                const isMe = isMeEntry(l);

                return (
                  <li
                    key={l.userId}
                    className={cn(
                      'relative flex items-center gap-3 sm:gap-4 px-4 md:px-5 py-3 transition-[opacity,background-color] duration-300',
                      isMe ? 'bg-brand/[0.07]' : 'hover:bg-ink/[0.02]',
                      mounted ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{
                      transitionDelay: mounted ? `${Math.min(i * 30, 300)}ms` : '0ms',
                    }}
                    aria-current={isMe ? 'true' : undefined}
                  >
                    {isMe && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" />}

                    {/* Rank */}
                    <div className="w-8 flex justify-center flex-shrink-0">
                      <RankMark rank={l.rank} />
                    </div>

                    <NeuralAvatar name={l.name} size="sm" />

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('font-medium text-sm truncate', isMe ? 'text-brand' : 'text-ink')}>
                          {l.name}
                        </span>
                        {isMe && (
                          <span className="flex-shrink-0 px-1.5 py-px rounded-full bg-brand text-on-brand text-[11px] font-semibold">You</span>
                        )}
                        <span className={cn('flex-shrink-0 px-2 py-px rounded-full text-[11px] font-medium hidden sm:inline-block', getBadgeStyle(l.badge))}>
                          {badgeLabel(l.badge)}
                        </span>
                      </div>
                      <p className="text-ink/50 text-xs mt-0.5">
                        {l.tests} test{l.tests !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Score + mini progress bar */}
                    <div className="w-24 sm:w-28 flex-shrink-0 text-right">
                      <div className="font-mono text-[15px] font-medium text-ink tabular">
                        {Math.round(l.score)}%
                      </div>
                      <div className="mt-1 ml-auto w-full h-1 bg-ink/[0.07] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{
                            width: mounted ? `${Math.round(l.score)}%` : '0%',
                            background: isMe ? 'rgb(var(--brand))' : 'rgb(var(--ink) / .35)',
                          }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="px-4 md:px-5 py-3 border-t border-line text-[13px] text-ink/50">
              Ranked by average score. Ties go to whoever has taken more tests.
            </p>
          </>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default LeaderboardPage;
