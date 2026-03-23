import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { licensesApi, clientsApi, productsApi, versionsApi } from '../../services/api';
import { useState } from 'react';

interface LicenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LicenseForm({ onSuccess, onCancel }: LicenseFormProps) {
  const [selectedProduct, setSelectedProduct] = useState('');

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      clientId: '', productId: '', planId: '', versionId: '',
      maxUsers: 1, startDate: '', endDate: '', autoRenew: false, notes: '',
    },
  });

  const { data: clientsData } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 200 }) });
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });
  const { data: versionsData } = useQuery({ queryKey: ['versions', selectedProduct], queryFn: () => versionsApi.getAll(selectedProduct || undefined), enabled: !!selectedProduct });

  const clients = clientsData?.data?.data || [];
  const products = productsData?.data?.data || [];
  const versions = versionsData?.data?.data || [];

  const selectedProductData = products.find((p: { id: string }) => p.id === selectedProduct);
  const plans = selectedProductData?.plans || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => licensesApi.create(data),
    onSuccess: () => { toast.success('Licencia creada exitosamente'); onSuccess(); },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al crear licencia');
    },
  });

  const onSubmit = (data: Record<string, unknown>) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cliente *</label>
        <select className="select" {...register('clientId', { required: true })}>
          <option value="">Seleccionar cliente...</option>
          {clients.map((c: { id: string; company_name?: string; first_name?: string; last_name?: string }) => (
            <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Producto *</label>
          <select className="select" {...register('productId', { required: true, onChange: (e) => setSelectedProduct(e.target.value) })}>
            <option value="">Seleccionar producto...</option>
            {products.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Plan</label>
          <select className="select" {...register('planId')}>
            <option value="">Sin plan específico</option>
            {plans.map((p: { id: string; name: string; type: string }) => (
              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Versión</label>
          <select className="select" {...register('versionId')} disabled={!selectedProduct}>
            <option value="">Sin versión específica</option>
            {versions.map((v: { id: string; version: string; version_name?: string }) => (
              <option key={v.id} value={v.id}>{v.version} {v.version_name ? `- ${v.version_name}` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Máx. Usuarios</label>
          <input type="number" min="1" className="input" {...register('maxUsers', { valueAsNumber: true, min: 1 })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha Inicio</label>
          <input type="date" className="input" {...register('startDate')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha Vencimiento</label>
          <input type="date" className="input" {...register('endDate')} />
          <p className="text-xs text-gray-600 mt-1">Dejar vacío para licencia permanente</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="autoRenew" className="w-4 h-4 rounded accent-primary-300" {...register('autoRenew')} />
        <label htmlFor="autoRenew" className="text-sm text-gray-400">Renovación automática</label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} placeholder="Observaciones adicionales..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando...' : 'Crear Licencia'}
        </button>
      </div>
    </form>
  );
}
