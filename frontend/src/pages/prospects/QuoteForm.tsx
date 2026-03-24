import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { prospectsApi } from '../../services/api';

interface Quote {
  id: string;
  quoteNumber?: string;
  productsDescription?: string;
  implementationFee: number;
  licenseFee: number;
  monthlyFee: number;
  currency: string;
  validityDate?: string;
  status: string;
  notes?: string;
}

interface Props {
  prospectId: string;
  quote?: Quote;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function QuoteForm({ prospectId, quote, onSuccess, onCancel }: Props) {
  const isEdit = !!quote;
  const lbl = { color: 'var(--text-muted)' };

  const { register, handleSubmit } = useForm({
    defaultValues: {
      quoteNumber: (quote as any)?.quote_number || quote?.quoteNumber || '',
      productsDescription: (quote as any)?.products_description || quote?.productsDescription || '',
      implementationFee: quote?.implementationFee ?? 0,
      licenseFee: quote?.licenseFee ?? 0,
      monthlyFee: quote?.monthlyFee ?? 0,
      currency: quote?.currency || 'MXN',
      validityDate: (quote?.validityDate || '').slice(0, 10),
      status: quote?.status || 'borrador',
      notes: quote?.notes || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (raw: Record<string, unknown>) => {
      const data = {
        quoteNumber: raw.quoteNumber || null,
        productsDescription: raw.productsDescription || null,
        implementationFee: Number(raw.implementationFee) || 0,
        licenseFee: Number(raw.licenseFee) || 0,
        monthlyFee: Number(raw.monthlyFee) || 0,
        currency: raw.currency,
        validityDate: raw.validityDate || null,
        status: raw.status,
        notes: raw.notes || null,
      };
      return isEdit
        ? prospectsApi.updateQuote(prospectId, quote!.id, data)
        : prospectsApi.addQuote(prospectId, data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cotización actualizada' : 'Cotización agregada');
      onSuccess();
    },
    onError: () => toast.error('Error al guardar cotización'),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d as Record<string, unknown>))} className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>No. Cotización</label>
          <input className="input" placeholder="COT-2024-001" {...register('quoteNumber')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Vigencia hasta</label>
          <input type="date" className="input" {...register('validityDate')} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Descripción de productos / servicios</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Ej: Sistema de inventario + módulo de ventas, implementación y soporte..."
            {...register('productsDescription')} />
        </div>
      </div>

      {/* Importes */}
      <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Importes de la cotización</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Implementación / Setup</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('implementationFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Costo único de arranque</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Licencia única (one-time)</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('licenseFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pago único por licencia perpetua</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Mensualidad</label>
            <input type="number" min="0" step="100" className="input" placeholder="0"
              {...register('monthlyFee')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Cobro recurrente mensual</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={lbl}>Moneda</label>
            <select className="select" {...register('currency')}>
              <option value="MXN">MXN — Pesos mexicanos</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estado y notas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Estado</label>
          <select className="select" {...register('status')}>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada al cliente</option>
            <option value="vista">Vista por el cliente</option>
            <option value="aceptada">Aceptada ✓</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={lbl}>Notas / Condiciones</label>
          <input className="input" placeholder="Descuentos, tiempo de entrega..."
            {...register('notes')} />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar Cotización' : 'Guardar Cotización'}
        </button>
      </div>
    </form>
  );
}
