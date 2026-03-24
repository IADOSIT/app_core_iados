import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentsApi, clientsApi } from '../../services/api';
import type { Payment } from '../../types';

interface PaymentFormProps {
  payment?: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ payment, onSuccess, onCancel }: PaymentFormProps) {
  const isEdit = !!payment;

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      clientId: (payment as any)?.client_id || payment?.clientId || '',
      amount: payment?.amount ? String(payment.amount) : '',
      currency: payment?.currency || 'MXN',
      exchangeRate: (payment as any)?.exchange_rate ?? payment?.exchangeRate ?? 1,
      status: payment?.status || 'pendiente',
      method: payment?.method || '',
      reference: payment?.reference || '',
      dueDate: ((payment as any)?.due_date || payment?.dueDate || '').slice(0, 10),
      notes: payment?.notes || '',
    },
  });

  const currency = watch('currency');
  const { data: clientsData } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 200 }) });
  const clients = clientsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? paymentsApi.updateStatus(payment!.id, data) : paymentsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Pago actualizado' : 'Pago registrado');
      onSuccess();
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al guardar pago');
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    if (isEdit) data.clientId = (payment as any)?.client_id || payment!.clientId;
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Cliente *</label>
        {isEdit ? (
          <input
            className="input"
            value={clients.find((c: { id: string }) => c.id === payment?.clientId)
              ? (() => { const c = clients.find((c: { id: string }) => c.id === payment?.clientId) as { company_name?: string; first_name?: string; last_name?: string }; return c?.company_name || `${c?.first_name} ${c?.last_name}`; })()
              : payment?.clientId || ''}
            readOnly
            style={{ opacity: 0.7 }}
          />
        ) : (
          <select className="select" {...register('clientId', { required: true })}>
            <option value="">Seleccionar cliente...</option>
            {clients.map((c: { id: string; company_name?: string; first_name?: string; last_name?: string }) => (
              <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Monto *</label>
          <input type="number" step="0.01" className="input" placeholder="0.00" {...register('amount', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Moneda</label>
          <select className="select" {...register('currency')}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {currency === 'USD' && (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Tipo de cambio (USD→MXN)</label>
          <input type="number" step="0.01" className="input" {...register('exchangeRate', { valueAsNumber: true })} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Método de Pago</label>
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
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado</label>
          <select className="select" {...register('status')}>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="fallido">Fallido</option>
            <option value="reembolsado">Reembolsado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Referencia / Folio</label>
          <input className="input" placeholder="REF-001" {...register('reference')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha de vencimiento</label>
          <input type="date" className="input" {...register('dueDate')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar Pago' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
}
