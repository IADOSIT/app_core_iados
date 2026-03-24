import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { expensesApi } from '../../services/api';

interface ExpenseFormProps { onSuccess: () => void; onCancel: () => void; }

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      categoryId: '', description: '', amount: '', currency: 'MXN', exchangeRate: 1,
      date: new Date().toISOString().split('T')[0], vendor: '', notes: '',
    },
  });

  const currency = watch('currency');
  const { data: catsData } = useQuery({ queryKey: ['expense-categories'], queryFn: () => expensesApi.getCategories() });
  const categories = catsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => expensesApi.create(data),
    onSuccess: () => { toast.success('Gasto registrado'); onSuccess(); },
    onError: () => toast.error('Error al registrar gasto'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Categoría</label>
        <select className="select" {...register('categoryId')}>
          <option value="">Sin categoría</option>
          {categories.map((c: { id: number; name: string; color: string }) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción *</label>
        <input className="input" placeholder="Ej: Renta servidor mensual" {...register('description', { required: true })} />
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
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha *</label>
          <input type="date" className="input" {...register('date', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Proveedor</label>
          <input className="input" placeholder="Ej: AWS, CFE, etc." {...register('vendor')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Registrar Gasto'}
        </button>
      </div>
    </form>
  );
}
