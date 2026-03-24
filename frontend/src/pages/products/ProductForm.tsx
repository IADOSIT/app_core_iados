import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi } from '../../services/api';
import { Plus, Trash2, Lock, Pencil, Check, X } from 'lucide-react';
import type { Product } from '../../types';

interface ProductFormProps { product?: Product; onSuccess: () => void; onCancel: () => void; }

interface PlanDraft { name: string; type: string; priceMxn: number; priceUsd: number; maxUsers: number | ''; durationDays: number | ''; }

const emptyPlan: PlanDraft = { name: '', type: 'mensual', priceMxn: 0, priceUsd: 0, maxUsers: '', durationDays: '' };

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!product;
  const [plans, setPlans] = useState<PlanDraft[]>([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<PlanDraft>(emptyPlan);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<PlanDraft>(emptyPlan);

  const p = product as any;
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      basePriceMxn: p?.base_price_mxn ?? product?.basePriceMxn ?? 0,
      basePriceUsd: p?.base_price_usd ?? product?.basePriceUsd ?? 0,
      apiSlug: p?.api_slug || product?.apiSlug || '',
      systemUrl: p?.system_url || product?.systemUrl || '',
      accessUrl: p?.access_url || p?.accessUrl || '',
      adminUser: p?.admin_user || p?.adminUser || '',
      adminPassword: '',
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

  const addPlan = async () => {
    if (!newPlan.name || !newPlan.type) return;
    if (isEdit) {
      setSavingPlan(true);
      try {
        await productsApi.addPlan(product!.id, newPlan as unknown as Record<string, unknown>);
        toast.success('Plan agregado');
        setNewPlan(emptyPlan);
        setShowAddPlan(false);
        onSuccess();
      } catch {
        toast.error('Error al agregar plan');
      } finally {
        setSavingPlan(false);
      }
    } else {
      setPlans([...plans, { ...newPlan }]);
      setNewPlan(emptyPlan);
      setShowAddPlan(false);
    }
  };

  const startEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setEditingPlanData({
      name: plan.name || '',
      type: plan.type || 'mensual',
      priceMxn: plan.price_mxn ?? plan.priceMxn ?? 0,
      priceUsd: plan.price_usd ?? plan.priceUsd ?? 0,
      maxUsers: plan.max_users ?? plan.maxUsers ?? '',
      durationDays: plan.duration_days ?? plan.durationDays ?? '',
    });
  };

  const savePlanEdit = async () => {
    if (!editingPlanId) return;
    setSavingPlan(true);
    try {
      await productsApi.updatePlan(product!.id, editingPlanId, editingPlanData as unknown as Record<string, unknown>);
      toast.success('Plan actualizado');
      setEditingPlanId(null);
      onSuccess();
    } catch {
      toast.error('Error al actualizar plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!window.confirm('¿Eliminar este plan?')) return;
    try {
      await productsApi.deletePlan(product!.id, planId);
      toast.success('Plan eliminado');
      onSuccess();
    } catch {
      toast.error('Error al eliminar plan');
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre del Producto *</label>
        <input className="input" placeholder="ej. Software ERP iados" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Descripción</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Precio base MXN</label>
          <input type="number" step="0.01" className="input" {...register('basePriceMxn', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Precio base USD</label>
          <input type="number" step="0.01" className="input" {...register('basePriceUsd', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Slug API <span className="font-normal">(ej. pos, acceso-digital)</span></label>
          <input className="input" placeholder="slug-del-sistema" {...register('apiSlug')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>URL del Sistema</label>
          <input type="url" className="input" placeholder="https://sistema.iados.mx" {...register('systemUrl')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>URL de Acceso Directo (botón Acceder)</label>
        <input type="url" className="input" placeholder="https://sistema.iados.mx/login" {...register('accessUrl')} />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Si difiere de la URL del sistema (ej. directo al login)</p>
      </div>

      {/* Vault */}
      <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.18)' }}>
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
          <Lock size={12} /> Credenciales Admin (Vault) — encriptadas en DB
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Usuario admin</label>
            <input className="input" placeholder="admin@sistema.com" {...register('adminUser')} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Contraseña admin {isEdit && '(dejar vacío = no cambiar)'}
            </label>
            <input type="password" className="input" placeholder={isEdit ? '••••••••' : 'Contraseña'} {...register('adminPassword')} />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Planes {isEdit && product?.plans?.length ? `(${product.plans.length} existentes)` : ''}
          </label>
          <button type="button" onClick={() => setShowAddPlan(!showAddPlan)} className="btn-secondary py-1 px-2 text-xs">
            <Plus size={12} />Agregar Plan
          </button>
        </div>

        {/* Existing plans in edit mode */}
        {isEdit && product?.plans && product.plans.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {product.plans.map((pl: any) => (
              <div key={pl.id}>
                {editingPlanId === pl.id ? (
                  <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="Nombre" value={editingPlanData.name} onChange={(e) => setEditingPlanData({ ...editingPlanData, name: e.target.value })} />
                      <select className="select text-sm" value={editingPlanData.type} onChange={(e) => setEditingPlanData({ ...editingPlanData, type: e.target.value })}>
                        <option value="mensual">Mensual</option>
                        <option value="permanente">Permanente</option>
                        <option value="por_implementacion">Implementación</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" className="input text-sm" placeholder="Precio MXN" value={editingPlanData.priceMxn} onChange={(e) => setEditingPlanData({ ...editingPlanData, priceMxn: Number(e.target.value) })} />
                      <input type="number" className="input text-sm" placeholder="Precio USD" value={editingPlanData.priceUsd} onChange={(e) => setEditingPlanData({ ...editingPlanData, priceUsd: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" className="input text-sm" placeholder="Máx. usuarios" value={editingPlanData.maxUsers} onChange={(e) => setEditingPlanData({ ...editingPlanData, maxUsers: e.target.value ? Number(e.target.value) : '' })} />
                      <input type="number" className="input text-sm" placeholder="Días vigencia" value={editingPlanData.durationDays} onChange={(e) => setEditingPlanData({ ...editingPlanData, durationDays: e.target.value ? Number(e.target.value) : '' })} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setEditingPlanId(null)} className="btn-ghost py-1 px-3 text-xs"><X size={12} /> Cancelar</button>
                      <button type="button" onClick={savePlanEdit} disabled={savingPlan} className="btn-secondary py-1 px-3 text-xs"><Check size={12} /> {savingPlan ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                    <div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{pl.name}</span>
                      <span className="text-xs ml-2 capitalize" style={{ color: 'var(--text-muted)' }}>{pl.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>${pl.price_mxn ?? pl.priceMxn} MXN{(pl.max_users ?? pl.maxUsers) ? ` · ${pl.max_users ?? pl.maxUsers} usr` : ''}</span>
                      <button type="button" onClick={() => startEditPlan(pl)} className="p-1 hover:text-blue-400" style={{ color: 'var(--text-muted)' }}><Pencil size={12} /></button>
                      <button type="button" onClick={() => deletePlan(pl.id)} className="p-1 hover:text-red-400" style={{ color: 'var(--text-muted)' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New plans (create mode) */}
        {!isEdit && plans.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {plans.map((pl, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                <div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{pl.name}</span>
                  <span className="text-xs ml-2 capitalize" style={{ color: 'var(--text-muted)' }}>{pl.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>${pl.priceMxn} MXN</span>
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
              <button type="button" onClick={addPlan} disabled={savingPlan} className="btn-secondary py-1 px-3 text-xs">
                {savingPlan ? 'Guardando...' : isEdit ? 'Guardar Plan' : 'Agregar'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
}
