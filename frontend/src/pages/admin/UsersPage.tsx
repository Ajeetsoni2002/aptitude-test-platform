// frontend/src/pages/admin/UsersPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronLeft, ChevronRight, Search, Trash2, Users, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import { getAllUsersApi, updateUserRoleApi, deleteUserApi, toggleUserStatusApi } from '@/api/adminApi';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const smallButton =
  'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 text-[13px] font-medium text-ink/75 transition-colors hover:border-ink/25 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45';

const formatJoined = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

const ButtonSpinner = () => (
  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers]           = useState<any[]>([]);
  const [isLoading, setLoading]     = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAllUsersApi(page, 10, search);
      if (r.success && r.data) {
        setUsers(r.data.users);
        setTotal(r.data.pagination.totalUsers);
        setTotalPages(r.data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(`Change role: "${currentRole}" → "${newRole}"?`)) return;
    setActionLoading(userId + '_role');
    try {
      await updateUserRoleApi(userId, newRole);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from the system?`)) return;
    setActionLoading(userId + '_del');
    try {
      await deleteUserApi(userId);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    setActionLoading(userId + '_status');
    try {
      await toggleUserStatusApi(userId);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };


  const runSearch = () => { setSearch(searchInput); setPage(1); };

  const renderActions = (user: (typeof users)[number]) => {
    const isAdmin = user.role === 'admin';
    return (
      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
        <button
          type="button"
          className={smallButton}
          onClick={() => navigate(`/admin/students/${user._id}/analytics`)}
        >
          <BarChart3 size={14} />
          Analytics
        </button>
        <button
          type="button"
          className={cn(smallButton, user.isActive === false ? 'hover:border-ok/40 hover:text-ok' : 'hover:border-warn/40 hover:text-warn')}
          onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
          disabled={actionLoading === user._id + '_status'}
        >
          {actionLoading === user._id + '_status'
            ? <><ButtonSpinner />Saving</>
            : user.isActive === false ? 'Activate' : 'Deactivate'
          }
        </button>
        <button
          type="button"
          className={smallButton}
          onClick={() => handleRoleChange(user._id, user.role)}
          disabled={!!actionLoading?.includes(user._id + '_role')}
        >
          {actionLoading === user._id + '_role'
            ? <><ButtonSpinner />Saving</>
            : isAdmin ? 'Make student' : 'Make admin'
          }
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-bad/10 hover:text-bad disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => handleDelete(user._id, user.name)}
          disabled={!!actionLoading?.includes(user._id + '_del')}
          title="Delete account"
          aria-label={`Delete ${user.name}`}
        >
          {actionLoading === user._id + '_del' ? <ButtonSpinner /> : <Trash2 size={15} />}
        </button>
      </div>
    );
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          eyebrow="People"
          title="Students"
          description="Every account, admins included. Open a student's results, change roles, or turn off access."
        />

        <AdminPanel contentClassName="p-0 sm:p-0">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  className="admin-input w-full py-2 pl-9 pr-3 text-sm"
                  placeholder="Search by name or email"
                  aria-label="Search users"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
                  }}
                />
              </div>
              <HoloButton variant="cyan" size="md" onClick={runSearch}>
                Search
              </HoloButton>
              {search && (
                <HoloButton
                  variant="ghost"
                  size="md"
                  icon={<X size={15} />}
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                >
                  Clear
                </HoloButton>
              )}
            </div>
            <p className="text-[13px] text-ink/55 sm:ml-2">
              <span className="font-medium text-ink tabular">{total}</span> {total === 1 ? 'account' : 'accounts'}
              {search ? <> matching &ldquo;{search}&rdquo;</> : null}
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner label="Loading accounts…" className="py-16" />
          ) : users.length === 0 ? (
            <div className="p-4 sm:p-5">
              <AdminEmptyState
                title={search ? 'No one matches that search' : 'No accounts yet'}
                description={search ? 'Check the spelling, or search by email instead.' : 'Accounts appear here as soon as people sign up.'}
                icon={<Users className="h-5 w-5" />}
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="admin-table text-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th className="!text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSelf  = user._id === currentUser?._id;
                      const isAdmin = user.role === 'admin';
                      const initials = user.name?.[0]?.toUpperCase() || '?';
                      return (
                        <tr key={user._id} className={cn(isSelf && '[&>td]:bg-brand/[0.04]')}>
                          <td className="min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold',
                                  isAdmin ? 'bg-plum/10 text-plum' : 'bg-brand/10 text-brand'
                                )}
                              >
                                {initials}
                              </span>
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 font-medium text-ink">
                                  <span className="truncate">{user.name}</span>
                                  {isSelf && <AdminStatusBadge tone="cyan" className="!px-2 !py-0 !text-[11px]">You</AdminStatusBadge>}
                                </p>
                                <p className="truncate text-[13px] text-ink/55">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <AdminStatusBadge tone={isAdmin ? 'violet' : 'default'}>
                              {isAdmin ? 'Admin' : 'Student'}
                            </AdminStatusBadge>
                          </td>
                          <td>
                            {user.isActive === false ? (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/55">
                                <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
                                Deactivated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-[13px] !text-ink/60 tabular">{formatJoined(user.createdAt)}</td>
                          <td>{!isSelf ? renderActions(user) : <span className="block text-right text-[12px] text-ink/40">This is you</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line md:hidden">
                {users.map((user) => {
                  const isSelf  = user._id === currentUser?._id;
                  const isAdmin = user.role === 'admin';
                  const initials = user.name?.[0]?.toUpperCase() || '?';
                  return (
                    <li key={user._id} className={cn('space-y-3 px-4 py-4', isSelf && 'bg-brand/[0.04]')}>
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold',
                            isAdmin ? 'bg-plum/10 text-plum' : 'bg-brand/10 text-brand'
                          )}
                        >
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                            {user.name}
                            {isSelf && <AdminStatusBadge tone="cyan" className="!px-2 !py-0 !text-[11px]">You</AdminStatusBadge>}
                          </p>
                          <p className="truncate text-[13px] text-ink/55">{user.email}</p>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink/55">
                            <AdminStatusBadge tone={isAdmin ? 'violet' : 'default'} className="!py-0 !text-[11px]">
                              {isAdmin ? 'Admin' : 'Student'}
                            </AdminStatusBadge>
                            <span>{user.isActive === false ? 'Deactivated' : 'Active'}</span>
                            <span className="text-ink/30">·</span>
                            <span>Joined {formatJoined(user.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      {!isSelf && renderActions(user)}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
              <button
                type="button"
                className={smallButton}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-[13px] text-ink/55">
                Page <span className="font-medium text-ink tabular">{page}</span> of <span className="tabular">{totalPages}</span>
              </span>
              <button
                type="button"
                className={smallButton}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
};

export default UsersPage;
