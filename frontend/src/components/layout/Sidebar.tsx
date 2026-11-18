// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyNotificationsApi } from '@/api/notificationApi';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { BrandMark, Wordmark } from '@/components/brand/BrandMark';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BarChart3, Clock3, Trophy, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, User, Bell, Shield, Plus, Flame, CalendarPlus, X,
} from 'lucide-react';

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ReactNode;
}

const getStreakCount = (userId: string) => parseInt(localStorage.getItem(`potd_streak_${userId}`) ?? '0');

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',      icon: <LayoutDashboard size={18} /> },
  { label: 'Daily question',  path: '/problem-of-day', icon: <Flame size={18} /> },
  { label: 'Analysis',        path: '/analysis',       icon: <BarChart3 size={18} /> },
  { label: 'History',         path: '/history',        icon: <Clock3 size={18} /> },
  { label: 'Leaderboard',     path: '/leaderboard',    icon: <Trophy size={18} /> },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Profile',       path: '/profile',       icon: <User size={18} /> },
  { label: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
  { label: 'Settings',      path: '/settings',      icon: <Settings size={18} /> },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?:  () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = ({ isMobile, onClose, collapsed: collapsedProp = false, onToggleCollapse }: SidebarProps) => {
  const collapsed = isMobile ? false : collapsedProp;
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const streak = getStreakCount(user?._id ?? '');

  useEffect(() => {
    if (user) {
      getMyNotificationsApi().then(res => {
        if (res.success && res.data) setUnreadCount(res.data.unreadCount);
      }).catch(() => null);
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0');

  return (
    <aside
      className="fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-line bg-raised transition-[width] duration-200"
      style={{ width: isMobile ? 260 : collapsed ? 72 : 248 }}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 flex-shrink-0', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? <BrandMark size={26} className="text-ink" /> : <Wordmark to="/dashboard" />}
        {isMobile && (
          <button onClick={onClose} aria-label="Close menu" className="text-ink/50 hover:text-ink p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Primary action */}
      <div className={cn('px-3 pb-3 flex-shrink-0', collapsed && 'px-2')}>
        <NavLink
          to="/test-setup"
          title={collapsed ? 'New test' : undefined}
          className={cn(
            'btn-holo-cyan flex items-center gap-2 rounded-lg text-sm h-10',
            collapsed ? 'justify-center px-0' : 'px-3'
          )}
        >
          <Plus size={17} className="flex-shrink-0" />
          {!collapsed && <span>Start a test</span>}
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isDaily = item.path === '/problem-of-day';
          return (
            <NavLink key={item.path} to={item.path} className={itemClass} title={collapsed ? item.label : undefined}>
              <span className="flex-shrink-0 relative">
                {item.icon}
                {collapsed && isDaily && streak > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-clay" />
                )}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isDaily && streak > 0 && (
                <span className="ml-auto font-mono text-[11px] text-clay" title={`${streak}-day streak`}>
                  {streak}d
                </span>
              )}
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <>
            {!collapsed && <p className="label-caps px-3 pt-5 pb-1.5">Admin</p>}
            {collapsed && <div className="my-3 mx-2 h-px bg-line" />}
            <NavLink to="/admin" end className={itemClass} title={collapsed ? 'Admin panel' : undefined}>
              <Shield size={18} className="flex-shrink-0" />
              {!collapsed && <span>Admin panel</span>}
            </NavLink>
            <NavLink to="/admin/create-test" className={itemClass} title={collapsed ? 'Create test' : undefined}>
              <CalendarPlus size={18} className="flex-shrink-0" />
              {!collapsed && <span>Create test</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Secondary nav */}
      <div className="px-3 py-2 space-y-0.5 flex-shrink-0 border-t border-line">
        {BOTTOM_ITEMS.map((item) => {
          const badge = item.label === 'Notifications' ? unreadCount : 0;
          return (
            <NavLink key={item.label} to={item.path} className={itemClass} title={collapsed ? item.label : undefined}>
              <span className="flex-shrink-0 relative">
                {item.icon}
                {badge > 0 && collapsed && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-bad" />}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-bad text-on-brand text-[11px] font-semibold flex items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User + controls */}
      <div className={cn('border-t border-line p-3 flex-shrink-0', collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5')}>
        {user && (
          <>
            <NeuralAvatar name={user.name} role={user.role} size="sm" imageUrl={user.profilePicture} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink truncate">{user.name}</p>
                <p className="text-xs text-ink/50 capitalize">{user.role}</p>
              </div>
            )}
          </>
        )}
        <ThemeToggle size="sm" className="border-transparent bg-transparent" />
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:text-bad hover:bg-bad/10 transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>

      {!isMobile && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full border border-line bg-surface text-ink/50 hover:text-ink flex items-center justify-center shadow-soft"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
