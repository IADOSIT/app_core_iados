import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '../../types';

interface NotificationsPanelProps {
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  licencia_vencimiento: '#FFC107',
  pago_pendiente: '#FF5252',
  pago_recibido: '#00E676',
  cliente_nuevo: '#2196F3',
  suscripcion_renovacion: '#9C27B0',
  sistema: '#607D8B',
  otro: '#9E9E9E',
};

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifications-count'] }); },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notifications-count'] }); },
  });

  const notifications: Notification[] = data?.data?.data || [];

  return (
    <div
      className="absolute right-0 top-12 w-80 rounded-2xl z-50 overflow-hidden shadow-card"
      style={{
        background: 'linear-gradient(145deg, #1A1A24, #111118)',
        border: '1px solid rgba(0,230,118,0.15)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-primary-300" />
          <span className="font-semibold text-sm">Notificaciones</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-gray-400 hover:text-primary-300 flex items-center gap-1"
          >
            <CheckCheck size={13} /> Todas leídas
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Sin notificaciones pendientes
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-white/[0.02]' : ''
              } hover:bg-white/[0.04]`}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: typeColors[n.type] || '#9E9E9E' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" />}
                  </div>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
