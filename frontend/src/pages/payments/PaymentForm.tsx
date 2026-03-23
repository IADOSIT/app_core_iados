import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentsApi, clientsApi } from '../../services/api';

interface PaymentFormProps { onSuccess: () => void; onCancel: () => void; }

export default function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      clientId: '', amount: '', currency: 'MXN', exchangeRate: 1,
      status: 'pendiente', method: '', reference: '', dueDate: '', notes: '',
    },
  });

  const currency = watch('currency');
  const { data: clientsData } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 200 }) });
  const clients = clientsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => paymentsApi.create(data),
    onSuccess: () => { toast.success('Pago registrado'); onSuccess(); },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al registrar pago');
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cliente *</label>
        <select className="select" {...register('clientId', { required: true })}>
          <option value="">Seleccionar cliente...</option>
          {clients.map((c: { id: string; company_name?: string; first_name?: string; last_name?: string }) => (
            <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Monto *</label>
          <input type="number" step="0.01" className="input" placeholder="0.00" {...register('amount', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Moneda</label>
          <select className="select" {...register('currency')}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {currency === 'USD' && (
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tipo de cambio (USD→MXN)</label>
          <input type="number" step="0.01" className="input" {...register('exchangeRate', { valueAsNumber: true })} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Método de Pago</label>
          <select className="select" {...register('method')}>
            <option value="">Sin especificar</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="efectivo">Efectivo</option>
            <option value="stripe">Stripe</option>
            <option value="mercadopago">MercadoPago</option>
            <option value="cheque">Cheque</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estado</label>
          <select className="select" {...register('status')}>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Referencia / Folio</label>
          <input className="input" placeholder="REF-001" {...register('reference')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha de vencimiento</label>
          <input type="date" className="input" {...register('dueDate')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
}
