import { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import NotificationsPanel from '../ui/NotificationsPanel';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getAll(true),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.data?.unreadCount || 0;

  return (
    <header
      className="flex items-center justify-between px-6 h-16 flex-shrink-0"
      style={{
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,230,118,0.08)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuToggle} className="md:hidden text-gray-400 hover:text-white">
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar clientes, licencias..."
            className="input pl-9 h-9 w-64 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Bell size={16} className="text-gray-400" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: '#00E676', color: '#0A0A0F', fontSize: '10px' }}
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #00E676, #00C853)', color: '#0A0A0F' }}
            >
              {user.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-white leading-tight">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 capitalize">{user.roleName}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
