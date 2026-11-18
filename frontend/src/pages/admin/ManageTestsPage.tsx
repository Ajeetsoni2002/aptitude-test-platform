import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import type { AdminTone } from '@/components/admin/AdminUI';
import { cn } from '@/lib/utils';
import { getAllScheduledTestsApi } from '@/api/scheduledApi';
import {
  Plus,
  Trash2,
  Eye,
  Edit2,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Lock,
  ClipboardList,
  Search,
  X,
} from 'lucide-react';

interface ScheduledTest {
  _id: string;
  title: string;
  testCode?: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  maxAttempts?: number;
  startTime: string;
  endTime?: string;
  status: 'locked' | 'live' | 'completed';
  assignedStudents: string[];
  customQuestions?: string[];
  createdAt: string;
  updatedAt: string;
}

type SortKey = 'title' | 'startTime' | 'status' | 'assignedStudents';

const STATUS_FILTERS: Array<{ value: 'all' | 'locked' | 'live' | 'completed'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'locked', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; icon: ReactNode; tone: AdminTone }> = {
    locked: {
      label: 'Scheduled',
      icon: <Lock className="h-3 w-3" />,
      tone: 'amber',
    },
    live: {
      label: 'Live',
      icon: <Radio className="h-3 w-3" />,
      tone: 'green',
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="h-3 w-3" />,
      tone: 'default',
    },
  };

  const config = configs[status] || configs.locked;

  return (
    <AdminStatusBadge tone={config.tone} className="gap-1.5 whitespace-nowrap">
      {config.icon}
      {config.label}
    </AdminStatusBadge>
  );
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

const iconButton =
  'grid h-8 w-8 place-items-center rounded-lg text-ink/55 transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

const ManageTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('startTime');
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'live' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch tests
  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAllScheduledTestsApi();
        if (response.success && response.data) {
          setTests(response.data);
        } else {
          setError('Failed to load tests');
        }
      } catch (err) {
        setError(`Error loading tests: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Filter and sort tests
  const filteredTests = tests
    .filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.testCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'startTime':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'assignedStudents':
          return b.assignedStudents.length - a.assignedStudents.length;
        default:
          return 0;
      }
    });

  // Handle delete
  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    setDeletingId(testId);
    try {
      // Note: deleteScheduledTestApi needs to be imported/created if it doesn't exist
      // For now, we'll show a message
      setError('Delete functionality coming soon');
    } catch (err) {
      setError(`Error deleting test: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: tests.length,
    live: tests.filter(t => t.status === 'live').length,
    locked: tests.filter(t => t.status === 'locked').length,
    completed: tests.filter(t => t.status === 'completed').length,
    totalStudents: tests.reduce((sum, t) => sum + t.assignedStudents.length, 0),
  };


  const renderActions = (test: ScheduledTest) => (
    <div className="flex items-center justify-end gap-1">
      <button onClick={() => {}} className={iconButton} title="View details" aria-label="View details">
        <Eye className="h-4 w-4" />
      </button>
      <button onClick={() => {}} className={iconButton} title="Edit test" aria-label="Edit test">
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(test._id)}
        disabled={deletingId === test._id}
        className={cn(iconButton, 'hover:bg-bad/10 hover:text-bad')}
        title="Delete test"
        aria-label="Delete test"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          eyebrow="Exams"
          title="Tests"
          description="Scheduled tests, when they open and close, and who they are assigned to."
          actions={
            <HoloButton onClick={() => navigate('/admin/create-test')} icon={<Plus className="h-4 w-4" />}>
              Create test
            </HoloButton>
          }
        />

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-[10px] border border-bad/30 bg-bad/[0.07] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-bad" />
            <p className="flex-1 text-sm text-ink/80">{error}</p>
            <button onClick={() => setError('')} className="text-ink/45 hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div role="status" className="flex items-start gap-3 rounded-[10px] border border-ok/30 bg-ok/[0.07] px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-ok" />
            <p className="flex-1 text-sm text-ink/80">{success}</p>
            <button onClick={() => setSuccess('')} className="text-ink/45 hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <AdminMetricCard label="All tests" value={stats.total} icon={<ClipboardList />} tone="default" />
          <AdminMetricCard label="Live now" value={stats.live} icon={<Radio />} tone="green" />
          <AdminMetricCard label="Scheduled" value={stats.locked} icon={<Lock />} tone="amber" caption="Not open yet" />
          <AdminMetricCard label="Completed" value={stats.completed} icon={<CheckCircle2 />} tone="default" />
          <AdminMetricCard
            label="Assignments"
            value={stats.totalStudents}
            icon={<Users />}
            tone="cyan"
            caption="Summed across tests"
            className="col-span-2 md:col-span-1"
          />
        </div>

        <AdminPanel contentClassName="p-0 sm:p-0">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-5 lg:flex-row lg:items-center">
            <div className="relative lg:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search by title or test code"
                aria-label="Search tests"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-input w-full py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div role="tablist" aria-label="Filter by status" className="inline-flex gap-0.5 rounded-[10px] border border-line bg-raised p-0.5">
                {STATUS_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={filterStatus === option.value}
                    data-active={filterStatus === option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className="admin-tab !px-3 !py-1.5 !text-[13px]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                aria-label="Sort tests"
                className="admin-input admin-select py-2 pl-3 text-sm"
              >
                <option value="startTime">Newest start time</option>
                <option value="title">Title (A to Z)</option>
                <option value="status">Status</option>
                <option value="assignedStudents">Most students</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner label="Loading tests…" className="py-16" />
          ) : filteredTests.length === 0 ? (
            <div className="p-4 sm:p-5">
              <AdminEmptyState
                title="No tests found"
                description={
                  tests.length === 0
                    ? 'You have not scheduled a test yet. Create one to assign it to students.'
                    : 'No test matches this search or status. Try clearing the search.'
                }
                icon={<ClipboardList className="h-5 w-5" />}
                action={
                  <HoloButton onClick={() => navigate('/admin/create-test')} icon={<Plus className="h-4 w-4" />}>
                    Create test
                  </HoloButton>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="admin-table text-sm">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th>Window</th>
                      <th className="!text-right">Questions</th>
                      <th className="!text-right">Duration</th>
                      <th className="!text-right">Attempts</th>
                      <th className="!text-right">Students</th>
                      <th className="!text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map(test => (
                      <tr key={test._id}>
                        <td className="min-w-[200px]">
                          <p className="font-medium text-ink">{test.title}</p>
                          {test.testCode && <p className="mt-0.5 font-mono text-[12px] text-ink/50">{test.testCode}</p>}
                        </td>
                        <td>{getStatusBadge(test.status)}</td>
                        <td className="whitespace-nowrap text-[13px]">
                          <p className="text-ink/80">{formatDateTime(test.startTime)}</p>
                          {test.endTime && <p className="text-ink/50">to {formatDateTime(test.endTime)}</p>}
                        </td>
                        <td className="text-right tabular">{test.questionCount}</td>
                        <td className="whitespace-nowrap text-right tabular">{test.timeLimit} min</td>
                        <td className="text-right tabular">{test.maxAttempts || 1}</td>
                        <td className="text-right tabular">{test.assignedStudents.length}</td>
                        <td>{renderActions(test)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line md:hidden">
                {filteredTests.map(test => (
                  <li key={test._id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{test.title}</p>
                        {test.testCode && <p className="mt-0.5 font-mono text-[12px] text-ink/50">{test.testCode}</p>}
                      </div>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="flex items-center gap-1.5 text-[13px] text-ink/60">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(test.startTime)}
                      {test.endTime && <> to {formatDateTime(test.endTime)}</>}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] text-ink/60">
                        {test.questionCount} questions · {test.timeLimit} min · {test.maxAttempts || 1} attempt
                        {(test.maxAttempts || 1) === 1 ? '' : 's'} · {test.assignedStudents.length} students
                      </p>
                      {renderActions(test)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
};

export default ManageTestsPage;
