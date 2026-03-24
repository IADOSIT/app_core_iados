import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '../../services/api';

interface UserFormProps { onSuccess: () => void; onCancel: () => void; }

export default function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '', password: '', firstName: '', lastName: '', phone: '', roleId: 2,
    },
  });

  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: () => usersApi.getRoles() });
  const roles = rolesData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data),
    onSuccess: () => { toast.success('Usuario creado'); onSuccess(); },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al crear usuario');
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre *</label>
          <input className="input" placeholder="Juan" {...register('firstName', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Apellido</label>
          <input className="input" placeholder="García" {...register('lastName')} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</label>
        <input type="email" className={`input ${errors.email ? 'border-red-500/50' : ''}`} placeholder="usuario@iados.mx" {...register('email', { required: true })} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Contraseña *</label>
        <input type="password" className="input" placeholder="Mínimo 8 caracteres" {...register('password', { required: true, minLength: 8 })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
          <input className="input" {...register('phone')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Rol</label>
          <select className="select" {...register('roleId', { valueAsNumber: true })}>
            {roles.map((r: { id: number; displayName: string; name: string }) => (
              <option key={r.id} value={r.id}>{r.displayName || r.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
}
