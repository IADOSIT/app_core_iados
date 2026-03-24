import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GitBranch, Star, Shield, Trash2, Users, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { versionsApi, productsApi } from '../../services/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import VersionForm from './VersionForm';
import { formatDate } from '../../utils/format';
import type { SoftwareVersion } from '../../types';
import toast from 'react-hot-toast';

function VersionCard({
  v,
  onEdit,
  onDelete,
}: {
  v: SoftwareVersion;
  onEdit: (v: SoftwareVersion) => void;
  onDelete: (v: SoftwareVersion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const r = v as any;
  const productName = r.product_name || v.productName;
  const versionName = r.version_name || v.versionName;
  const releaseNotes = r.release_notes || v.releaseNotes;
  const isLatest = r.is_latest ?? v.isLatest;
  const isStable = r.is_stable ?? v.isStable;
  const releasedAt = r.released_at || v.releasedAt;
  const createdAt = r.created_at || v.createdAt;

  return (
    <div className="card p-4 space-y-3">
      {/* Product tag + actions */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold truncate max-w-[60%]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          }}
        >
          <GitBranch size={10} />
          {productName || <span style={{ opacity: 0.5 }}>Sin sistema</span>}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(v)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            title="Editar versión"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(v)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
            title="Eliminar versión"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Version number + name */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-lg font-bold" style={{ color: 'var(--accent)' }}>v{v.version}</span>
            {isLatest && <Star size={13} style={{ color: '#F59E0B' }} fill="currentColor" />}
            {isStable && <Shield size={13} style={{ color: '#10B981' }} />}
          </div>
          {versionName && (
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{versionName}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {isLatest && <span className="badge badge-yellow text-xs">Latest</span>}
          {isStable && <span className="badge badge-green text-xs">Estable</span>}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users size={10} /> {r.client_count || 0} clientes
          </span>
          <span>{r.license_count || 0} lic. activas</span>
        </div>
        <span>{releasedAt ? formatDate(releasedAt) : formatDate(createdAt)}</span>
      </div>

      {/* Expandable release notes */}
      {releaseNotes && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <span>Notas de lanzamiento</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {expanded && (
            <div
              className="mt-1.5 px-3 py-2.5 rounded-lg text-xs whitespace-pre-wrap leading-relaxed"
              style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
            >
              {releaseNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VersionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editVersion, setEditVersion] = useState<SoftwareVersion | null>(null);
  const [productFilter, setProductFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['versions', productFilter],
    queryFn: () => versionsApi.getAll(productFilter || undefined),
  });

  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  const versions: SoftwareVersion[] = data?.data?.data || [];
  const products = productsData?.data?.data || [];

  const deleteVersion = useMutation({
    mutationFn: (id: string) => versionsApi.delete(id),
    onSuccess: () => { toast.success('Versión eliminada'); qc.invalidateQueries({ queryKey: ['versions'] }); },
    onError: () => toast.error('Error al eliminar versión'),
  });

  const handleDelete = (v: SoftwareVersion) => {
    const name = (v as any).version_name || v.versionName;
    if (!window.confirm(`¿Eliminar v${v.version}${name ? ` — ${name}` : ''}? Esta acción no se puede deshacer.`)) return;
    deleteVersion.mutate(v.id);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['versions'] });

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
        <select className="select h-9 text-sm w-52" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
          <option value="">Todos los sistemas</option>
          {products.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : versions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={GitBranch}
            title="Sin versiones"
            description="Registra la primera versión de software"
            action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nueva Versión</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v) => (
            <VersionCard
              key={v.id}
              v={v}
              onEdit={(v) => setEditVersion(v)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Nueva Versión" onClose={() => setShowForm(false)}>
          <VersionForm
            onSuccess={() => { setShowForm(false); invalidate(); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editVersion && (
        <Modal title="Editar Versión" onClose={() => setEditVersion(null)}>
          <VersionForm
            version={editVersion}
            onSuccess={() => { setEditVersion(null); invalidate(); }}
            onCancel={() => setEditVersion(null)}
          />
        </Modal>
      )}
    </div>
  );
}
