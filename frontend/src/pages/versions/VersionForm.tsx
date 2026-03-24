import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { versionsApi, productsApi } from '../../services/api';

interface VersionFormProps { onSuccess: () => void; onCancel: () => void; }

export default function VersionForm({ onSuccess, onCancel }: VersionFormProps) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      productId: '', version: '', versionName: '', releaseNotes: '',
      isStable: true, isLatest: false, releasedAt: new Date().toISOString().split('T')[0],
    },
  });

  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });
  const products = productsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => versionsApi.create(data),
    onSuccess: () => { toast.success('Versión creada'); onSuccess(); },
    onError: () => toast.error('Error al crear versión'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Producto *</label>
        <select className="select" {...register('productId', { required: true })}>
          <option value="">Seleccionar...</option>
          {products.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Versión * (ej: 2.1.0)</label>
          <input className="input font-mono" placeholder="1.0.0" {...register('version', { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre de versión</label>
          <input className="input" placeholder="ej: Actualización Mayor" {...register('versionName')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas de lanzamiento</label>
        <textarea className="input resize-none" rows={3} placeholder="Cambios, mejoras, correcciones..." {...register('releaseNotes')} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha de lanzamiento</label>
        <input type="date" className="input" {...register('releasedAt')} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }}>
          <input type="checkbox" className="accent-primary-300 w-4 h-4" {...register('isStable')} />
          Versión estable
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }}>
          <input type="checkbox" className="accent-primary-300 w-4 h-4" {...register('isLatest')} />
          Versión más reciente (latest)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancelar</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando...' : 'Crear Versión'}
        </button>
      </div>
    </form>
  );
}
