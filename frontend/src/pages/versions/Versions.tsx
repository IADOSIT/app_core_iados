import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, GitBranch, Star, Shield } from 'lucide-react';
import { versionsApi, productsApi } from '../../services/api';
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
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.1)' }}>
                    <GitBranch size={15} style={{ color: '#00E676' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-primary-300">v{v.version}</span>
                      {v.isLatest && <Star size={12} className="text-yellow-400" fill="currentColor" />}
                      {v.isStable && <Shield size={12} className="text-green-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{v.productName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {v.isLatest && <span className="badge badge-yellow text-xs">Latest</span>}
                  {v.isStable && <span className="badge badge-green text-xs">Estable</span>}
                </div>
              </div>

              {v.versionName && <p className="text-xs text-gray-400">{v.versionName}</p>}
              {v.releaseNotes && (
                <p className="text-xs text-gray-500 line-clamp-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {v.releaseNotes}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Licencias: {v.licenseCount || 0}</span>
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
