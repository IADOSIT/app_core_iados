import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { versionsApi, productsApi } from '../../services/api';
import type { SoftwareVersion } from '../../types';

interface VersionFormProps {
  version?: SoftwareVersion;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VersionForm({ version, onSuccess, onCancel }: VersionFormProps) {
  const isEdit = !!version;

  const { register, handleSubmit } = useForm({
    defaultValues: {
      productId: (version as any)?.product_id || version?.productId || '',
      version: version?.version || '',
      versionName: version?.versionName || '',
      releaseNotes: version?.releaseNotes || '',
      isStable: version?.isStable ?? true,
      isLatest: version?.isLatest ?? false,
      releasedAt: version?.releasedAt
        ? version.releasedAt.split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });
  const products = productsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? versionsApi.update(version!.id, data) : versionsApi.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Versión actualizada' : 'Versión creada'); onSuccess(); },
    onError: () => toast.error(isEdit ? 'Error al actualizar versión' : 'Error al crear versión'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Producto / Sistema *</label>
        {isEdit ? (
          <input
            className="input"
            value={(version as any)?.product_name || (version as any)?.productName || 'Sistema'}
            readOnly
            style={{ opacity: 0.7 }}
          />
        ) : (
          <select className="select" {...register('productId', { required: true })}>
            <option value="">Seleccionar...</option>
            {products.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Versión * <span className="font-normal">(ej: 2.1.0)</span>
          </label>
          <input
            className="input font-mono"
            placeholder="1.0.0"
            {...register('version', { required: true })}
            readOnly={isEdit}
            style={isEdit ? { opacity: 0.7 } : {}}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre de mejora</label>
          <input className="input" placeholder="ej: Actualización Mayor" {...register('versionName')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas de lanzamiento</label>
        <textarea className="input resize-none" rows={4} placeholder="Cambios, mejoras, correcciones..." {...register('releaseNotes')} />
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
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar Versión' : 'Crear Versión'}
        </button>
      </div>
    </form>
  );
}
