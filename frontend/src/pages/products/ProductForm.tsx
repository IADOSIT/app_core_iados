import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi } from '../../services/api';
import { Plus, Trash2 } from 'lucide-react';
import type { Product } from '../../types';

interface ProductFormProps { product?: Product; onSuccess: () => void; onCancel: () => void; }

interface PlanDraft { name: string; type: string; priceMxn: number; priceUsd: number; maxUsers: number | ''; durationDays: number | ''; }

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!product;
  const [plans, setPlans] = useState<PlanDraft[]>(isEdit ? [] : []);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<PlanDraft>({ name: '', type: 'mensual', priceMxn: 0, priceUsd: 0, maxUsers: '', durationDays: '' });

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      basePriceMxn: product?.basePriceMxn || 0,
      basePriceUsd: product?.basePriceUsd || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const payload = { ...data, plans };
      return isEdit ? productsApi.update(product!.id, payload) : productsApi.create(payload);
    },
    onSuccess: () => { toast.success(isEdit ? 'Producto actualizado' : 'Producto creado'); onSuccess(); },
    onError: () => toast.error('Error al guardar producto'),
  });

  const addPlan = () => {
    if (!newPlan.name || !newPlan.type) return;
    setPlans([...plans, { ...newPlan }]);
    setNewPlan({ name: '', type: 'mensual', priceMxn: 0, priceUsd: 0, maxUsers: '', durationDays: '' });
    setShowAddPlan(false);
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre del Producto *</label>
        <input className="input" placeholder="ej. Software ERP iados" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripción</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Precio base MXN</label>
          <input type="number" step="0.01" className="input" {...register('basePriceMxn', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Precio base USD</label>
          <input type="number" step="0.01" className="input" {...register('basePriceUsd', { valueAsNumber: true })} />
        </div>
      </div>

      {/* Plans */}
      {!isEdit && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-400">Planes</label>
            <button type="button" onClick={() => setShowAddPlan(true)} className="btn-secondary py-1 px-2 text-xs">
              <Plus size={12} />Agregar Plan
            </button>
          </div>

          {plans.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {plans.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <span className="text-xs font-semibold text-white">{p.name}</span>
                    <span className="text-xs text-gray-500 ml-2 capitalize">{p.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-primary-300">${p.priceMxn} MXN</span>
                    <button type="button" onClick={() => setPlans(plans.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddPlan && (
            <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.1)' }}>
              <div className="grid grid-cols-2 gap-2">
                <input className="input text-sm" placeholder="Nombre del plan" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
                <select className="select text-sm" value={newPlan.type} onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}>
                  <option value="mensual">Mensual</option>
                  <option value="permanente">Permanente</option>
                  <option value="por_implementacion">Implementación</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="input text-sm" placeholder="Precio MXN" value={newPlan.priceMxn} onChange={(e) => setNewPlan({ ...newPlan, priceMxn: Number(e.target.value) })} />
                <input type="number" className="input text-sm" placeholder="Precio USD" value={newPlan.priceUsd} onChange={(e) => setNewPlan({ ...newPlan, priceUsd: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="input text-sm" placeholder="Máx. usuarios" value={newPlan.maxUsers} onChange={(e) => setNewPlan({ ...newPlan, maxUsers: e.target.value ? Number(e.target.value) : '' })} />
                <input type="number" className="input text-sm" placeholder="Días vigencia (0=permanente)" value={newPlan.durationDays} onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value ? Number(e.target.value) : '' })} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddPlan(false)} className="btn-ghost py-1 px-3 text-xs">Cancelar</button>
                <button type="button" onClick={addPlan} className="btn-secondary py-1 px-3 text-xs">Agregar</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
}
