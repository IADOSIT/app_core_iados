import { useState } from 'react';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import NotificationsPanel from '../ui/NotificationsPanel';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getAll(true),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.data?.unreadCount || 0;

  return (
    <header
      className="flex items-center justify-between px-6 h-16 flex-shrink-0 transition-all duration-300"
      style={{
        background: 'var(--bg-header)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuToggle} className="md:hidden" style={{ color: 'var(--text-secondary)' }}>
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar clientes, licencias..."
            className="input pl-9 h-9 w-64 text-sm"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="theme-toggle"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--bg-btn-ghost)',
              border: '1px solid var(--border-btn-ghost)',
              color: 'var(--text-secondary)',
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-btn-text)', fontSize: '10px' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationsPanel onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--accent-btn-text)' }}
            >
              {user.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user.roleName}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
