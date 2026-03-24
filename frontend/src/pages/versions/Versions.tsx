import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GitBranch, Star, Shield, Trash2, Users } from 'lucide-react';
import { versionsApi, productsApi } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import VersionForm from './VersionForm';
import { formatDate } from '../../utils/format';
import type { SoftwareVersion } from '../../types';

export default function VersionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [productFilter, setProductFilter] = useState('');

  const deleteVersion = useMutation({
    mutationFn: (id: string) => versionsApi.delete(id),
    onSuccess: () => { toast.success('Versión eliminada'); qc.invalidateQueries({ queryKey: ['versions'] }); },
    onError: () => toast.error('Error al eliminar versión'),
  });

  const handleDelete = (v: SoftwareVersion) => {
    if (!window.confirm(`¿Eliminar v${v.version}${v.versionName ? ` (${v.versionName})` : ''}? Esta acción no se puede deshacer.`)) return;
    deleteVersion.mutate(v.id);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['versions', productFilter],
    queryFn: () => versionsApi.getAll(productFilter || undefined),
  });

  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  const versions: SoftwareVersion[] = data?.data?.data || [];
  const products = productsData?.data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Versiones de Software</h1>
          <p className="page-subtitle">{versions.length} versiones registradas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nueva Versión
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="select h-9 text-sm w-48" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
          <option value="">Todos los productos</option>
          {products.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : versions.length === 0 ? (
        <div className="card">
          <EmptyState icon={GitBranch} title="Sin versiones" description="Registra la primera versión de software" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nueva Versión</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v) => (
            <div key={v.id} className="card p-4 space-y-3">
              {/* Product tag */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    color: 'var(--accent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                  }}
                >
                  <GitBranch size={10} /> {(v as any).productName || 'Sin sistema'}
                </span>
                <button
                  onClick={() => handleDelete(v)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                  title="Eliminar versión"
                  disabled={deleteVersion.isPending}
                >
                  <Trash2 size={11} />
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,230,118,0.1)' }}>
                    <GitBranch size={15} style={{ color: '#00E676' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>v{v.version}</span>
                      {v.isLatest && <Star size={12} style={{ color: '#F59E0B' }} fill="currentColor" />}
                      {v.isStable && <Shield size={12} style={{ color: '#10B981' }} />}
                    </div>
                    {v.versionName && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.versionName}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {v.isLatest && <span className="badge badge-yellow text-xs">Latest</span>}
                  {v.isStable && <span className="badge badge-green text-xs">Estable</span>}
                </div>
              </div>

              {v.releaseNotes && (
                <p className="text-xs line-clamp-2 p-2 rounded-lg" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
                  {v.releaseNotes}
                </p>
              )}

              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {(v as any).clientCount || 0} clientes
                  </span>
                  <span>{v.licenseCount || 0} lic. activas</span>
                </div>
                <span>{v.releasedAt ? formatDate(v.releasedAt) : formatDate(v.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Nueva Versión" onClose={() => setShowForm(false)}>
          <VersionForm onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['versions'] }); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
