import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { getMyNotificationsApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '@/api/notificationApi';
import { startScheduledTestApi } from '@/api/testApi';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCheck, Play, ClipboardList, Bell, Lock, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getMyNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsReadApi(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsReadApi();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch { /* silent */ }
  };

  const handleStartScheduled = async (notificationId: string, test: any) => {
    // Determine runtime status
    const now = Date.now();
    const start = new Date(test.startTime).getTime();
    const end = test.endTime
      ? new Date(test.endTime).getTime()
      : start + test.timeLimit * 60000;
    const status = now < start ? 'locked' : now < end ? 'live' : 'completed';

    if (status === 'locked' || startingTestId) return;
    
    setError(null);
    setStartingTestId(test._id);
    try {
      const res = await startScheduledTestApi(test._id);

      if (res.success && res.data) {
        // Mark as read when starting
        await handleMarkAsRead(notificationId);
        navigate('/test', {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
            title: res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime: res.data.durationSeconds ?? test.timeLimit * 60,
            isProctored: true,
          },
        });
      } else {
        // Handle API errors (including "already attempted")
        const errorMessage = res.message || 'Failed to start test. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start test. Please try again.';
      setError(errorMessage);
      console.error("Failed to start scheduled test", err);
    } finally {
      setStartingTestId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Notifications</h1>
          <p className="text-[15px] text-ink/60 mt-1">
            {isLoading
              ? 'Test assignments and other updates.'
              : unreadCount > 0
                ? `${unreadCount} unread.`
                : 'All caught up. Test assignments and other updates show up here.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <HoloButton
            variant="ghost"
            size="md"
            onClick={handleMarkAllRead}
            icon={<CheckCheck size={16} />}
          >
            Mark all as read
          </HoloButton>
        )}
      </header>

      <NeonCard padding="p-0" className="animate-fade-up overflow-hidden" hover={false}>
        {isLoading ? (
          <div className="py-16 flex justify-center items-center">
            <LoadingSpinner size="md" label="Loading notifications…" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
            <span className="w-11 h-11 rounded-full bg-raised border border-line flex items-center justify-center mb-4 text-ink/40">
              <Bell size={20} />
            </span>
            <p className="text-ink/60 text-sm max-w-sm">
              No notifications yet. When a test is assigned to you, it will show up here.
            </p>
          </div>
        ) : (
          <>
            {/* Error alert for test start failures */}
            {error && (
              <div className="flex items-start gap-3 m-4 p-3.5 rounded-[10px] bg-bad/10 border border-bad/25 animate-fade-in">
                <AlertCircle size={16} className="text-bad flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-bad text-sm leading-snug">{error}</p>
                <button
                  onClick={() => setError(null)}
                  aria-label="Dismiss"
                  className="text-bad/60 hover:text-bad transition-colors flex-shrink-0 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <ul className="divide-y divide-line">
              {notifications.map(n => (
                <li
                  key={n._id}
                  className={cn(
                    'relative px-4 md:px-5 py-4 flex items-start gap-4 transition-colors',
                    !n.isRead && 'bg-brand/[0.04]'
                  )}
                >
                  {!n.isRead && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" aria-hidden />}

                  <span className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    n.isRead ? 'bg-raised border border-line text-ink/40' : 'bg-brand/10 text-brand'
                  )}>
                    {n.type === 'test_assigned' ? <ClipboardList size={17} /> : <Bell size={17} />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-3 mb-0.5">
                      <p className={cn('text-[15px] font-semibold', n.isRead ? 'text-ink/65' : 'text-ink')}>
                        {!n.isRead && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </p>
                      <span className="text-ink/45 text-xs font-mono flex-shrink-0">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={cn('text-sm leading-relaxed', n.isRead ? 'text-ink/50' : 'text-ink/70')}>
                      {n.message}
                    </p>

                    {/* Scheduled Test Start Action */}
                    {n.type === 'test_assigned' && n.relatedEntity && (
                      <div className="mt-3 flex items-center gap-3">
                        {(() => {
                          const test = n.relatedEntity;
                          const now = Date.now();
                          const start = new Date(test.startTime).getTime();
                          const end = test.endTime
                            ? new Date(test.endTime).getTime()
                            : start + test.timeLimit * 60000;
                          const isLocked = now < start;
                          const isLive = now >= start && now < end;

                          return (
                            <>
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-warn font-medium bg-warn/10 px-2.5 py-1 rounded-full">
                                  <Lock size={12} /> Opens at {new Date(test.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : isLive ? (
                                <HoloButton
                                  variant="cyan"
                                  size="sm"
                                  onClick={() => handleStartScheduled(n._id, test)}
                                  loading={startingTestId === test._id}
                                  icon={<Play size={14} />}
                                >
                                  Start test
                                </HoloButton>
                              ) : (
                                <span className="text-xs text-ink/55 font-medium bg-ink/[0.06] px-2.5 py-1 rounded-full">
                                  This test has closed
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-surface text-ink/55 hover:text-ink hover:border-ink/30 transition-colors"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Check size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default NotificationsPage;
