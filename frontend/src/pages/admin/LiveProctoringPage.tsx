// frontend/src/pages/admin/LiveProctoringPage.tsx
// Real-time live proctoring dashboard with WebSocket support
// Monitors students during tests in real-time

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/AdminLayout';
import { proctoringSocket } from '@/services/proctoringSocket';
import { cn } from '@/lib/utils';
import apiClient from '@/api/axios';
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPage,
} from '@/components/admin/AdminUI';
import {
  AlertTriangle, Shield, Clock, User, Monitor,
  CheckCircle2, Camera, CameraOff,
  X, Search, AlertCircle, Activity,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface ActiveStudent {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  attemptId: string;
  testName: string;
  status: 'active' | 'suspicious' | 'disconnected';
  joinedAt: Date;
  violationCount: number;
  lastViolation?: string;
  cameraActive: boolean;
  frameData?: string;
  faceDetected: boolean;
  tabSwitchCount: number;
}

const STATUS_LABEL: Record<ActiveStudent['status'], string> = {
  active: 'Live',
  suspicious: 'Flagged',
  disconnected: 'Disconnected',
};

const STATUS_DOT: Record<ActiveStudent['status'], string> = {
  active: 'bg-ok',
  suspicious: 'bg-bad',
  disconnected: 'bg-snow/50',
};

const flagTone = (count: number) =>
  count === 0
    ? 'border-ok/25 bg-ok/10 text-ok'
    : count <= 2
      ? 'border-warn/30 bg-warn/10 text-warn'
      : 'border-bad/25 bg-bad/10 text-bad';

const flagLabel = (count: number) =>
  count === 0 ? 'No flags' : `${count} ${count === 1 ? 'flag' : 'flags'}`;

// ── Student Card Component ─────────────────────────────────────
const StudentCard = ({ student, onSelect }: {
  student: ActiveStudent;
  onSelect: (student: ActiveStudent) => void;
}) => {
  const isSuspicious = student.status === 'suspicious';
  const isDisconnected = student.status === 'disconnected';
  const timeSpent = Math.floor((Date.now() - new Date(student.joinedAt).getTime()) / 60000);

  return (
    <button
      type="button"
      className={cn(
        'group w-full overflow-hidden rounded-[14px] border bg-surface text-left shadow-soft transition-colors',
        isSuspicious ? 'border-bad/50 hover:border-bad' : 'border-line hover:border-ink/25',
        isDisconnected && 'opacity-60'
      )}
      onClick={() => onSelect(student)}
    >
      {/* Camera area */}
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-coal">
        {student.frameData && student.cameraActive ? (
          <img
            src={student.frameData}
            alt={student.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-snow/15 bg-snow/5 sm:h-12 sm:w-12">
              {student.cameraActive ? (
                <User size={22} className="text-snow/40" />
              ) : (
                <CameraOff size={20} className="text-snow/40" />
              )}
            </div>
            <p className="hidden text-[12px] text-snow/45 sm:block">
              {student.cameraActive ? 'Waiting for video' : 'Camera off'}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-coal/70 px-2 py-0.5 text-[11px] font-medium text-snow">
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[student.status])} />
          {STATUS_LABEL[student.status]}
        </div>

        {/* Violation count */}
        {student.violationCount > 0 && (
          <div
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-bad px-2 py-0.5 font-mono text-[11px] font-medium text-on-brand"
            title={`${student.violationCount} violations`}
          >
            <AlertTriangle size={11} />
            {student.violationCount}
          </div>
        )}

        {/* Face detection */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-coal/70 px-2 py-0.5 text-[11px] text-snow">
          <span className={cn('h-1.5 w-1.5 rounded-full', student.faceDetected ? 'bg-ok' : 'bg-warn')} />
          {student.faceDetected ? 'Face visible' : 'No face'}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{student.name}</p>
          <p className="truncate text-[12px] text-ink/55">{student.testName}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-mono text-[12px] text-ink/50">
            <Clock size={12} />
            {timeSpent} min
          </span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', flagTone(student.violationCount))}>
            {flagLabel(student.violationCount)}
          </span>
        </div>
      </div>
    </button>
  );
};

// ── Detail Modal ───────────────────────────────────────────────
const StudentDetail = ({ student, onClose }: {
  student: ActiveStudent | null;
  onClose: () => void;
}) => {
  if (!student) return null;

  const statusText = {
    active: 'text-ok',
    suspicious: 'text-bad',
    disconnected: 'text-ink/50',
  }[student.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-coal/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${student.name}, proctoring details`}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-[14px] border border-line bg-surface shadow-float sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{student.name}</p>
            <p className="truncate font-mono text-[12px] text-ink/55">{student.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-ink/[0.05] hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 p-5 sm:p-6">
          {/* Camera Feed */}
          {student.frameData && (
            <div className="overflow-hidden rounded-[10px] bg-coal">
              <img
                src={student.frameData}
                alt="Camera feed"
                className="h-64 w-full object-cover"
              />
            </div>
          )}

          {/* Camera Status */}
          <div className="flex items-start gap-3 rounded-[10px] border border-line bg-raised px-4 py-3">
            {student.cameraActive ? (
              <>
                <Camera size={17} className="mt-0.5 flex-shrink-0 text-ok" />
                <div>
                  <p className="text-sm font-medium text-ink">Camera on</p>
                  <p className={cn('mt-0.5 text-[13px]', student.faceDetected ? 'text-ink/55' : 'text-warn')}>
                    {student.faceDetected
                      ? 'Face is visible in the frame.'
                      : 'No face in the frame. The student may have stepped away.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <CameraOff size={17} className="mt-0.5 flex-shrink-0 text-ink/45" />
                <div>
                  <p className="text-sm font-medium text-ink">Camera off</p>
                  <p className="mt-0.5 text-[13px] text-ink/55">No video is coming through from this student.</p>
                </div>
              </>
            )}
          </div>

          {/* Test + status */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="label-caps">Test</dt>
              <dd className="mt-1 font-medium text-ink">{student.testName}</dd>
            </div>
            <div>
              <dt className="label-caps">Status</dt>
              <dd className={cn('mt-1 font-medium', statusText)}>{STATUS_LABEL[student.status]}</dd>
            </div>
          </dl>

          {/* Violation Details */}
          <div className="rounded-[10px] border border-line">
            <p className="border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">
              Violations <span className="font-mono font-normal text-ink/50">({student.violationCount})</span>
            </p>
            {student.violationCount === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-ok">
                <CheckCircle2 size={16} />
                <span>No violations so far</span>
              </div>
            ) : (
              <dl className="divide-y divide-line text-[13px]">
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-ink/60">Total violations</dt>
                  <dd className="font-mono font-medium text-bad">{student.violationCount}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-ink/60">Tab switches</dt>
                  <dd className="font-mono text-warn">{student.tabSwitchCount}</dd>
                </div>
                {student.lastViolation && (
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink/60">Last violation</dt>
                    <dd className="text-right text-warn">{student.lastViolation}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FILTERS: { value: 'all' | 'active' | 'suspicious'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspicious', label: 'Flagged' },
];

// ── Main Page ──────────────────────────────────────────────────
const LiveProctoringPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ActiveStudent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ActiveStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspicious'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoadingOldData, setIsLoadingOldData] = useState(true);

  // Fallback HTTP polling
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const fetchActiveTests = async () => {
      try {
        const res = await apiClient.get('/proctoring/active');
        if (res.data.success && res.data.data.activeTests) {
          const tests = res.data.data.activeTests;
          // Convert old format to new format
          const converted = tests.map((t: any) => ({
            socketId: t._id,
            userId: t.user._id,
            name: t.user.name,
            email: t.user.email,
            attemptId: t._id,
            testName: t.title,
            status: t.violations.length >= 2 ? 'suspicious' : 'active',
            joinedAt: t.createdAt,
            violationCount: t.violations.length,
            cameraActive: true,
            faceDetected: true,
            tabSwitchCount: 0,
          }));
          setStudents(converted);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('[Proctoring] Fetch failed:', error);
      } finally {
        setIsLoadingOldData(false);
      }
    };

    fetchActiveTests();
    const interval = setInterval(fetchActiveTests, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.role]);

  // Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const connectSocket = async () => {
      try {
        const token = localStorage.getItem('apt_token');
        if (!token) return;

        await proctoringSocket.connect(token);
        setIsConnected(true);

        proctoringSocket.subscribeToMonitoring();

        proctoringSocket.on('admin:students:list', (data: any) => {
          setStudents(data.students || []);
          setLastUpdate(new Date());
        });

        proctoringSocket.on('admin:student:joined', (data: any) => {
          setStudents((prev) => [...prev, data.student]);
          setLastUpdate(new Date());
        });

        proctoringSocket.on('admin:violation:logged', (data: any) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.userId === data.studentId ? { ...s, ...data.student } : s
            )
          );
      setLastUpdate(new Date());
        });
      } catch (error) {
        console.error('[Proctoring] Socket failed:', error);
      }
    };

    connectSocket();
    return () => proctoringSocket.disconnect();
  }, [isAuthenticated, user?.role]);

  // Filter students
  useEffect(() => {
    let filtered = students;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.testName.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, statusFilter]);

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === 'active').length,
    suspicious: students.filter((s) => s.status === 'suspicious').length,
    totalViolations: students.reduce((sum, s) => sum + s.violationCount, 0),
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <AdminLayout>
        <AdminPage>
          <AdminEmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Admins only"
            description="You need an admin account to watch live tests."
          />
        </AdminPage>
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout>
        <AdminPage>
          {/* Connection status + filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-80">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search by name, email or test"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-input h-10 w-full pl-9 pr-3 text-sm"
                  aria-label="Search students"
                />
              </div>
              <div className="inline-flex w-fit rounded-[10px] bg-ink/[0.04] p-1" role="tablist" aria-label="Filter by status">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === f.value}
                    data-active={statusFilter === f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className="admin-tab !py-1.5"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="flex items-center gap-2 text-[13px] text-ink/60">
              <span className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-ok' : 'bg-warn')} />
              {isConnected ? 'Live connection' : 'Refreshing every 15 seconds'}
              {lastUpdate && (
                <span className="text-ink/45">
                  · updated <span className="font-mono">{lastUpdate.toLocaleTimeString()}</span>
                </span>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <AdminMetricCard label="Students in a test" value={stats.total} icon={<Monitor />} tone="default" />
            <AdminMetricCard label="Active" value={stats.active} icon={<Activity />} tone="green" />
            <AdminMetricCard
              label="Flagged"
              value={<span className={stats.suspicious > 0 ? 'text-bad' : undefined}>{stats.suspicious}</span>}
              icon={<AlertTriangle />}
              tone="red"
              caption="Two or more violations"
            />
            <AdminMetricCard label="Violations" value={stats.totalViolations} icon={<Shield />} tone="amber" caption="Total across all students" />
          </div>

          {/* Student Grid */}
          {isLoadingOldData ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="overflow-hidden rounded-[14px] border border-line bg-surface">
                  <div className="aspect-video animate-pulse bg-ink/[0.06] motion-reduce:animate-none" />
                  <div className="space-y-2 p-3.5">
                    <div className="h-3 w-3/4 rounded bg-ink/[0.07]" />
                    <div className="h-2.5 w-1/2 rounded bg-ink/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            students.length === 0 ? (
              <AdminEmptyState
                icon={<Camera className="h-5 w-5" />}
                title="No tests in progress"
                description="Camera feeds show up here as soon as a student starts a proctored test."
              />
            ) : (
              <AdminEmptyState
                icon={<Search className="h-5 w-5" />}
                title="No students match these filters"
                description="Try a different name or switch the filter back to All."
              />
            )
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.userId}
                  student={student}
                  onSelect={setSelectedStudent}
                />
              ))}
            </div>
          )}
        </AdminPage>
      </AdminLayout>

      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </>
  );
};

export default LiveProctoringPage;
