import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoicesApi, clientsApi } from '../../services/api';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface InvoiceFormProps { onSuccess: () => void; onCancel: () => void; }

export default function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const { register, handleSubmit, watch, control } = useForm({
    defaultValues: {
      clientId: '', taxRate: 16, discount: 0, currency: 'MXN', exchangeRate: 1, dueDate: '', notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 16 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const taxRate = watch('taxRate');
  const discount = watch('discount');

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100)), 0);
  const discountAmt = Number(discount) || 0;
  const tax = (subtotal - discountAmt) * (Number(taxRate) / 100);
  const total = subtotal - discountAmt + tax;

  const { data: clientsData } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 200 }) });
  const clients = clientsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoicesApi.create(data),
    onSuccess: () => { toast.success('Factura creada'); onSuccess(); },
    onError: () => toast.error('Error al crear factura'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cliente *</label>
          <select className="select" {...register('clientId', { required: true })}>
            <option value="">Seleccionar...</option>
            {clients.map((c: { id: string; company_name?: string; first_name?: string; last_name?: string }) => (
              <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Moneda</label>
          <select className="select" {...register('currency')}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-400">Conceptos</label>
          <button type="button" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 16 })} className="btn-secondary py-1 px-2 text-xs">
            <Plus size={12} /> Agregar
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="col-span-5">
                <input className="input text-xs" placeholder="Descripción del concepto" {...register(`items.${idx}.description`, { required: true })} />
              </div>
              <div className="col-span-1">
                <input type="number" step="0.01" min="0.01" className="input text-xs text-center" placeholder="Cant" {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
              </div>
              <div className="col-span-2">
                <input type="number" step="0.01" min="0" className="input text-xs" placeholder="Precio" {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })} />
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-primary-300 text-right">
                  {formatCurrency((items[idx]?.quantity || 0) * (items[idx]?.unitPrice || 0))}
                </div>
              </div>
              <div className="col-span-1">
                <input type="number" step="1" min="0" max="100" className="input text-xs text-center" placeholder="Desc%" {...register(`items.${idx}.discount`, { valueAsNumber: true })} />
              </div>
              <div className="col-span-1 flex justify-end">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">IVA (%)</label>
              <input type="number" step="0.01" className="input" {...register('taxRate', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descuento ($)</label>
              <input type="number" step="0.01" className="input" {...register('discount', { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha de vencimiento</label>
            <input type="date" className="input" {...register('dueDate')} />
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Descuento</span>
              <span className="text-red-400">- {formatCurrency(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IVA ({taxRate}%)</span>
            <span className="text-gray-400">{formatCurrency(tax)}</span>
          </div>
          <hr className="divider" />
          <div className="flex justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-primary-300 text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando...' : 'Crear Factura'}
        </button>
      </div>
    </form>
  );
}
