// src/components/AdminLayout.tsx
// Admin shell: same sidebar language as the student app, with the admin
// sections grouped by job (content, exams, people, system).
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, BarChart3, Bell, BookOpen, ClipboardCheck, LayoutDashboard,
  LogOut, Menu, PanelLeftClose, PanelLeftOpen, Radar, Settings2, Upload, Users, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getMyNotificationsApi } from '@/api/notificationApi';
import { BrandMark, Wordmark } from '@/components/brand/BrandMark';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { path: '/admin', label: 'Dashboard', description: 'Activity across the platform', icon: LayoutDashboard, exact: true },
      { path: '/admin/analytics', label: 'Analytics', description: 'Scores, sections and trends', icon: BarChart3 },
    ],
  },
  {
    title: 'Content',
    items: [
      { path: '/admin/questions', label: 'Question bank', description: 'Search, edit and review questions', icon: BookOpen },
      { path: '/admin/upload', label: 'Add questions', description: 'Write one or upload an Excel sheet', icon: Upload },
    ],
  },
  {
    title: 'Exams',
    items: [
      { path: '/admin/manage-tests', label: 'Tests', description: 'Create and schedule tests', icon: ClipboardCheck },
      { path: '/admin/live-proctoring', label: 'Live proctoring', description: 'Camera feeds and flags during a test', icon: Radar },
    ],
  },
  {
    title: 'People & system',
    items: [
      { path: '/admin/users', label: 'Students', description: 'Accounts, sections and access', icon: Users },
      { path: '/admin/settings', label: 'Settings', description: 'Proctoring rules and defaults', icon: Settings2 },
    ],
  },
];

// Pages reached from inside other sections. Not in the sidebar, but the
// top bar still needs a title for them.
const EXTRA_TITLES: NavItem[] = [
  { path: '/admin/create-test', label: 'Create test', description: 'Set up and schedule a new test', icon: ClipboardCheck },
  { path: '/admin/create-full-length-test', label: 'Create full-length test', description: 'Set up a multi-section test', icon: ClipboardCheck },
  { path: '/admin/students/', label: 'Student analytics', description: 'One student’s attempts and progress', icon: Users },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const isNavItemActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.path : pathname.startsWith(item.path);

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate: () => void;
  handleLogout: () => void;
}

const SidebarContent = ({ collapsed, onNavigate, handleLogout }: SidebarContentProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center px-4 flex-shrink-0', collapsed && 'justify-center px-0')}>
        {collapsed ? (
          <BrandMark size={26} className="text-ink" />
        ) : (
          <div className="flex items-center gap-2">
            <Wordmark to="/admin" />
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/55">
              Admin
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="pt-3 first:pt-1">
            {!collapsed ? (
              <p className="label-caps px-3 pb-1.5">{group.title}</p>
            ) : (
              <div className="mx-2 mb-2 h-px bg-line first:hidden" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            navigate('/dashboard');
          }}
          title={collapsed ? 'Student view' : undefined}
          className={cn('nav-item w-full', collapsed && 'justify-center px-0')}
        >
          <ArrowLeftRight size={18} className="flex-shrink-0" />
          {!collapsed && <span>Student view</span>}
        </button>
      </div>

      <div className={cn('border-t border-line p-3 flex-shrink-0', collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5')}>
        <NeuralAvatar name={user?.name || 'Admin'} size="sm" imageUrl={user?.profilePicture} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{user?.name || 'Administrator'}</p>
            <p className="truncate text-xs text-ink/50">Administrator</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:text-bad hover:bg-bad/10 transition-colors"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
}

const COLLAPSE_KEY = 'aetherexam-admin-collapsed';

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    let mounted = true;
    getMyNotificationsApi()
      .then((response) => {
        if (!mounted || !response?.success) return;
        const notifications = response.data?.notifications || [];
        setUnreadCount(notifications.filter((n: { isRead?: boolean }) => !n.isRead).length);
      })
      .catch(() => {
        if (mounted) setUnreadCount(0);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeItem = useMemo(
    () =>
      EXTRA_TITLES.find((item) => location.pathname.startsWith(item.path)) ??
      ALL_ITEMS.find((item) => isNavItemActive(location.pathname, item)) ??
      ALL_ITEMS[0],
    [location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-surface flex min-h-screen w-full bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0 border-r border-line bg-raised transition-[width] duration-200"
        style={{ width: collapsed ? 72 : 248 }}
      >
        <SidebarContent collapsed={collapsed} onNavigate={() => undefined} handleLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-coal/40 lg:hidden animate-fade-in"
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-[264px] border-r border-line bg-raised lg:hidden animate-slide-in-left">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/60 hover:text-ink"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} handleLogout={handleLogout} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink/70 hover:text-ink lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={17} />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/55 hover:text-ink hover:bg-ink/5 lg:grid"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-[22px] leading-tight text-ink">{activeItem.label}</h1>
                <p className="hidden truncate text-[13px] text-ink/55 sm:block">{activeItem.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle size="md" />
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink/65 hover:text-ink hover:border-ink/30"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-bad px-1 text-[10px] font-semibold text-on-brand">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div key={location.pathname} className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6 lg:px-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
