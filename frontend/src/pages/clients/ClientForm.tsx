import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clientsApi } from '../../services/api';
import { Lock } from 'lucide-react';
import type { Client } from '../../types';

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!client;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: client?.type || 'empresa',
      status: client?.status || 'prospecto',
      companyName: client?.companyName || '',
      rfc: client?.rfc || '',
      industry: client?.industry || '',
      website: client?.website || '',
      firstName: client?.firstName || '',
      lastName: client?.lastName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      whatsapp: client?.whatsapp || '',
      address: client?.address || '',
      city: client?.city || '',
      state: client?.state || '',
      country: client?.country || 'México',
      postalCode: client?.postalCode || '',
      profitPersonCount: client?.profitPersonCount || 2,
      notes: client?.notes || '',
      adminUser: (client as any)?.adminUser || '',
      adminPassword: '',
      paymentCutoffDay: (client as any)?.payment_cutoff_day || '',
      formalStartDate: (client as any)?.formal_start_date?.split('T')[0] || '',
      demoStartDate: (client as any)?.demo_start_date?.split('T')[0] || '',
      demoEndDate: (client as any)?.demo_end_date?.split('T')[0] || '',
    },
  });

  const clientType = watch('type');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? clientsApi.update(client!.id, data) : clientsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado exitosamente');
      onSuccess();
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Error al guardar cliente');
    },
  });

  const onSubmit = (data: Record<string, unknown>) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Tipo y Estado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Tipo *</label>
          <select className="select" {...register('type', { required: true })}>
            <option value="empresa">Empresa</option>
            <option value="persona_fisica">Persona Física</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado</label>
          <select className="select" {...register('status')}>
            <option value="prospecto">Prospecto</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>
      </div>

      {/* Datos empresa */}
      {clientType === 'empresa' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Razón Social / Nombre Empresa *</label>
            <input className="input" placeholder="Empresa S.A. de C.V." {...register('companyName', { required: clientType === 'empresa' })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>RFC</label>
            <input className="input" placeholder="XAXX010101000" {...register('rfc')} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Industria</label>
            <input className="input" placeholder="Tecnología, Manufactura..." {...register('industry')} />
          </div>
        </div>
      )}

      {/* Nombre contacto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {clientType === 'empresa' ? 'Nombre Contacto' : 'Nombre *'}
          </label>
          <input
            className="input"
            placeholder="Juan"
            {...register('firstName', { required: clientType === 'persona_fisica' })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Apellido</label>
          <input className="input" placeholder="García" {...register('lastName')} />
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email *</label>
          <input
            type="email"
            className={`input ${errors.email ? 'border-red-500/50' : ''}`}
            placeholder="contacto@empresa.com"
            {...register('email', { required: 'Email requerido' })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
          <input className="input" placeholder="+52 55 1234 5678" {...register('phone')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>WhatsApp</label>
          <input className="input" placeholder="+52 55 1234 5678" {...register('whatsapp')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Sitio Web</label>
          <input className="input" placeholder="https://empresa.com" {...register('website')} />
        </div>
      </div>

      {/* Dirección */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Ciudad</label>
          <input className="input" placeholder="CDMX" {...register('city')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado</label>
          <input className="input" placeholder="Ciudad de México" {...register('state')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Personas</label>
          <select className="select" {...register('profitPersonCount', { valueAsNumber: true })}>
            <option value={2}>2 personas</option>
            <option value={3}>3 personas</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas</label>
        <textarea className="input resize-none" rows={2} placeholder="Información adicional..." {...register('notes')} />
      </div>

      {/* Fechas importantes */}
      <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)' }}>
        <p className="text-xs font-semibold" style={{ color: '#3B82F6' }}>Fechas y periodo</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Día de corte (1-31)</label>
            <input type="number" min={1} max={31} className="input" placeholder="ej. 15" {...register('paymentCutoffDay', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha ingreso formal</label>
            <input type="date" className="input" {...register('formalStartDate')} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Inicio periodo demo</label>
            <input type="date" className="input" {...register('demoStartDate')} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Fin periodo demo</label>
            <input type="date" className="input" {...register('demoEndDate')} />
          </div>
        </div>
      </div>

      {/* Vault credenciales del cliente */}
      <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.18)' }}>
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
          <Lock size={12} /> Credenciales proporcionadas al cliente — encriptadas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Usuario admin</label>
            <input className="input" placeholder="usuario@cliente.com" {...register('adminUser')} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Contraseña {isEdit && '(vacío = no cambiar)'}
            </label>
            <input type="password" className="input" placeholder={isEdit ? '••••••••' : 'Contraseña'} {...register('adminPassword')} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 justify-center"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
}
