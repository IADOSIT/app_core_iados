import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Users, Plus, Edit2, Power, KeyRound, Shield, Mail,
  Phone, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/format';
import type { User } from '../../types';

const roleColors: Record<string, string> = {
  admin: 'badge-red',
  manager: 'badge-blue',
  sales: 'badge-green',
  support: 'badge-yellow',
};

// ─── Form para crear / editar usuario ────────────────────────────
interface UserFormData {
  email: string; firstName: string; lastName: string;
  phone: string; roleId: number; password: string;
}

function UserForm({ user, roles, onSuccess, onCancel }: {
  user?: User; roles: any[];
  onSuccess: () => void; onCancel: () => void;
}) {
  const isEdit = !!user;
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      roleId: roles.find(r => r.name === user?.roleName)?.id || 2,
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const payload: Record<string, unknown> = {
        firstName: data.firstName, lastName: data.lastName,
        phone: data.phone, roleId: data.roleId,
      };
      if (!isEdit) { payload.email = data.email; payload.password = data.password; }
      return isEdit ? usersApi.update(user!.id, payload) : usersApi.create(payload);
    },
    onSuccess: () => { toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado'); onSuccess(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al guardar usuario'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
          <input className="input" placeholder="Juan" {...register('firstName', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Apellido *</label>
          <input className="input" placeholder="Pérez" {...register('lastName', { required: true })} />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</label>
          <input type="email" className="input" placeholder="usuario@iados.mx"
            {...register('email', { required: true })} />
          {errors.email && <p className="text-xs text-red-400 mt-1">Email requerido</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
          <input className="input" placeholder="+52 55 1234 5678" {...register('phone')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Rol *</label>
          <select className="select" {...register('roleId', { valueAsNumber: true, required: true })}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.display_name || r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Contraseña *</label>
          <input type="password" className="input" placeholder="Mínimo 6 caracteres"
            {...register('password', { required: !isEdit, minLength: 6 })} />
          {errors.password && <p className="text-xs text-red-400 mt-1">Mínimo 6 caracteres</p>}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
}

// ─── Modal reset contraseña ───────────────────────────────────────
function ResetPasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { register, handleSubmit, watch } = useForm({ defaultValues: { newPassword: '', confirm: '' } });
  const mutation = useMutation({
    mutationFn: (data: { newPassword: string }) => usersApi.resetPassword(userId, data),
    onSuccess: () => { toast.success('Contraseña reseteada'); onClose(); },
    onError: () => toast.error('Error al resetear contraseña'),
  });
  const pwd = watch('newPassword');

  return (
    <form onSubmit={handleSubmit((d) => { if (d.newPassword !== d.confirm) { toast.error('Las contraseñas no coinciden'); return; } mutation.mutate({ newPassword: d.newPassword }); })} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nueva contraseña</label>
        <input type="password" className="input" {...register('newPassword', { required: true, minLength: 6 })} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirmar contraseña</label>
        <input type="password" className="input" {...register('confirm', { required: true, validate: v => v === pwd || 'No coinciden' })} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Resetear Contraseña'}
        </button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles(),
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const users: User[] = usersData?.data?.data || [];
  const roles: any[] = rolesData?.data?.data || [];

  const isAdmin = currentUser?.roleName === 'admin';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios del Sistema</h1>
          <p className="page-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Nuevo Usuario
          </button>
        )}
      </div>

      {/* Tarjetas de roles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: 'admin', label: 'Administradores', icon: Shield, color: '#FF5252' },
          { name: 'manager', label: 'Gerentes', icon: Users, color: '#2196F3' },
          { name: 'sales', label: 'Ventas', icon: CheckCircle, color: 'var(--accent)' },
          { name: 'support', label: 'Soporte', icon: Clock, color: '#FFC107' },
        ].map(({ name, label, icon: Icon, color }) => {
          const count = users.filter(u => u.roleName === name).length;
          return (
            <div key={name} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{count}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="card">
        {isLoading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState icon={Users} title="Sin usuarios" description="No hay usuarios registrados" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Contacto</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--accent-btn-text)' }}
                          >
                            {u.firstName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                              {u.firstName} {u.lastName}
                              {isSelf && <span className="badge badge-green text-xs">Tú</span>}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${roleColors[u.roleName] || 'badge-gray'} capitalize`}>
                          {u.roleDisplay || u.roleName}
                        </span>
                      </td>
                      <td>
                        {u.phone ? (
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Phone size={11} /> {u.phone}
                          </div>
                        ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.lastLogin ? formatDate(u.lastLogin) : 'Nunca'}
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="badge badge-green flex items-center gap-1">
                            <CheckCircle size={10} /> Activo
                          </span>
                        ) : (
                          <span className="badge badge-gray flex items-center gap-1">
                            <XCircle size={10} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditUser(u)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setResetPwdUser(u)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                              title="Resetear contraseña"
                            >
                              <KeyRound size={12} />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => toggleActive.mutate(u.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{
                                  background: u.isActive ? 'rgba(255,82,82,0.1)' : 'rgba(0,200,83,0.1)',
                                  color: u.isActive ? '#FF5252' : 'var(--accent)',
                                }}
                                title={u.isActive ? 'Desactivar' : 'Activar'}
                              >
                                <Power size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {(showForm || editUser) && (
        <Modal
          title={editUser ? `Editar: ${editUser.firstName} ${editUser.lastName}` : 'Nuevo Usuario'}
          onClose={() => { setShowForm(false); setEditUser(null); }}
        >
          <UserForm
            user={editUser || undefined}
            roles={roles}
            onSuccess={() => { setShowForm(false); setEditUser(null); qc.invalidateQueries({ queryKey: ['users'] }); }}
            onCancel={() => { setShowForm(false); setEditUser(null); }}
          />
        </Modal>
      )}

      {resetPwdUser && (
        <Modal
          title={`Resetear contraseña: ${resetPwdUser.firstName}`}
          onClose={() => setResetPwdUser(null)}
          size="sm"
        >
          <ResetPasswordModal
            userId={resetPwdUser.id}
            onClose={() => setResetPwdUser(null)}
          />
        </Modal>
      )}
    </div>
  );
}
