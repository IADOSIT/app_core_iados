import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Users, Bell, Key, Plus, Settings as SettingsIcon } from 'lucide-react';
import { usersApi, notificationsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import UserForm from './UserForm';
import toast from 'react-hot-toast';
import type { User } from '../../types';

export default function SettingsPage() {
  const [tab, setTab] = useState<'users' | 'notifications' | 'password'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: user?.roleName === 'admin',
  });

  const { data: notifSettings } = useQuery({
    queryKey: ['notif-settings'],
    queryFn: () => notificationsApi.getSettings(),
  });

  const { register: regNotif, handleSubmit: handleNotif } = useForm({
    values: notifSettings?.data?.data ? {
      emailEnabled: notifSettings.data.data.email_enabled,
      emailAddress: notifSettings.data.data.email_address,
      whatsappEnabled: notifSettings.data.data.whatsapp_enabled,
      whatsappNumber: notifSettings.data.data.whatsapp_number,
    } : undefined,
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const notifMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => notificationsApi.updateSettings(data),
    onSuccess: () => { toast.success('Configuración guardada'); qc.invalidateQueries({ queryKey: ['notif-settings'] }); },
  });

  const pwdMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.changePassword(data),
    onSuccess: () => { toast.success('Contraseña actualizada'); resetPwd(); },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al cambiar contraseña');
    },
  });

  const users: User[] = usersData?.data?.data || [];

  const tabs = [
    { key: 'users', label: 'Usuarios', icon: Users, adminOnly: true },
    { key: 'notifications', label: 'Notificaciones', icon: Bell },
    { key: 'password', label: 'Contraseña', icon: Key },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Administra usuarios y preferencias</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.filter(t => !t.adminOnly || user?.roleName === 'admin').map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${tab === key ? 'text-dark' : 'text-gray-400 hover:text-white'}`}
            style={tab === key ? { background: 'linear-gradient(135deg,#00E676,#00C853)', color: '#0A0A0F' } : {}}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && user?.roleName === 'admin' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowUserForm(true)} className="btn-primary">
              <Plus size={15} />Nuevo Usuario
            </button>
          </div>

          <div className="card">
            {usersLoading ? <LoadingSpinner /> : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676' }}>
                              {u.firstName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm text-white">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="text-sm text-gray-400">{u.email}</td>
                        <td><span className="badge badge-blue capitalize">{u.roleName}</span></td>
                        <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                        <td className="text-xs text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-MX') : 'Nunca'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="card p-5 max-w-lg">
          <h3 className="text-sm font-semibold text-white mb-4">Preferencias de Notificaciones</h3>
          <form onSubmit={handleNotif((d) => notifMutation.mutate(d))} className="space-y-4">
            <div className="p-3 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary-300 w-4 h-4" {...regNotif('emailEnabled')} />
                <span className="text-sm text-white">Notificaciones por Email</span>
              </label>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Dirección de email</label>
                <input className="input text-sm" placeholder="tu@email.com" {...regNotif('emailAddress')} />
              </div>
            </div>

            <div className="p-3 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary-300 w-4 h-4" {...regNotif('whatsappEnabled')} />
                <span className="text-sm text-white">Notificaciones por WhatsApp</span>
              </label>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número WhatsApp</label>
                <input className="input text-sm" placeholder="+52 55 1234 5678" {...regNotif('whatsappNumber')} />
              </div>
            </div>

            <button type="submit" className="btn-primary justify-center w-full" disabled={notifMutation.isPending}>
              {notifMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="card p-5 max-w-lg">
          <h3 className="text-sm font-semibold text-white mb-4">Cambiar Contraseña</h3>
          <form onSubmit={handlePwd((d) => pwdMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña actual</label>
              <input type="password" className="input" {...regPwd('currentPassword', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nueva contraseña</label>
              <input type="password" className="input" {...regPwd('newPassword', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirmar contraseña</label>
              <input type="password" className="input" {...regPwd('confirmPassword', { required: true })} />
            </div>
            <button type="submit" className="btn-primary justify-center w-full" disabled={pwdMutation.isPending}>
              {pwdMutation.isPending ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      )}

      {showUserForm && (
        <Modal title="Nuevo Usuario" onClose={() => setShowUserForm(false)}>
          <UserForm onSuccess={() => { setShowUserForm(false); qc.invalidateQueries({ queryKey: ['users'] }); }} onCancel={() => setShowUserForm(false)} />
        </Modal>
      )}
    </div>
  );
}
