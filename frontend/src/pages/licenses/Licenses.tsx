import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Key, AlertTriangle, CheckCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { licensesApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import LicenseForm from './LicenseForm';
import RenewModal from './RenewModal';
import { formatDate } from '../../utils/format';
import type { License } from '../../types';
import toast from 'react-hot-toast';

export default function LicensesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLicense, setEditLicense] = useState<License | null>(null);
  const [renewLicense, setRenewLicense] = useState<License | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', page, status, expiringSoon],
    queryFn: () => licensesApi.getAll({ page, limit: 20, status: status || undefined, expiringSoon }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => licensesApi.activate(id),
    onSuccess: () => {
      toast.success('Licencia activada');
      qc.invalidateQueries({ queryKey: ['licenses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => licensesApi.delete(id),
    onSuccess: () => {
      toast.success('Licencia eliminada');
      qc.invalidateQueries({ queryKey: ['licenses'] });
    },
    onError: () => toast.error('Error al eliminar la licencia'),
  });

  const handleDelete = (lic: License) => {
    const key = (lic as any).license_key || lic.licenseKey;
    if (!window.confirm(`¿Eliminar permanentemente la licencia ${key}?\nEsta acción no se puede deshacer.`)) return;
    deleteMutation.mutate(lic.id);
  };

  const licenses: License[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Licencias</h1>
          <p className="page-subtitle">{total} licencias registradas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nueva Licencia
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select className="select h-9 text-sm w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencida">Vencida</option>
          <option value="suspendida">Suspendida</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <button
          onClick={() => { setExpiringSoon(!expiringSoon); setPage(1); }}
          className={expiringSoon ? 'btn-primary' : 'btn-secondary'}
        >
          <AlertTriangle size={14} />
          Por vencer (30 días)
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <LoadingSpinner />
        ) : licenses.length === 0 ? (
          <EmptyState icon={Key} title="Sin licencias" description="Crea tu primera licencia" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nueva Licencia</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Clave de Licencia</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Usuarios</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic.id}>
                    <td>
                      <span className="font-mono text-xs text-primary-300 bg-primary-300/10 px-2 py-0.5 rounded-lg">
                        {(lic as any).license_key || lic.licenseKey}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {(lic as any).company_name || `${(lic as any).client_first || ''} ${(lic as any).client_last || ''}`.trim() || '—'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{(lic as any).client_email}</div>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {(lic as any).product_name || lic.productName || '—'}
                    </td>
                    <td>
                      {((lic as any).plan_type || lic.planType) && (
                        <div>
                          <StatusBadge status={(lic as any).plan_type || lic.planType} />
                          {((lic as any).plan_name || lic.planName) && (
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {(lic as any).plan_name || lic.planName}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={lic.status} /></td>
                    <td>
                      <div className="text-xs">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{(lic as any).current_users ?? lic.currentUsers ?? 0}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/{(lic as any).max_users ?? lic.maxUsers}</span>
                      </div>
                    </td>
                    <td>
                      {((lic as any).end_date || lic.endDate) ? (
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-primary)' }}>{formatDate((lic as any).end_date || lic.endDate)}</div>
                          {((lic as any).days_remaining ?? lic.daysRemaining) != null && (
                            <div className={`text-xs font-semibold ${((lic as any).days_remaining ?? lic.daysRemaining) <= 7 ? 'text-red-400' : ((lic as any).days_remaining ?? lic.daysRemaining) <= 30 ? 'text-yellow-400' : ''}`}
                              style={((lic as any).days_remaining ?? lic.daysRemaining) > 30 ? { color: 'var(--text-muted)' } : {}}>
                              {((lic as any).days_remaining ?? lic.daysRemaining) > 0 ? `${(lic as any).days_remaining ?? lic.daysRemaining}d restantes` : 'Vencida'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-green">Permanente</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {lic.status === 'pendiente' && (
                          <button onClick={() => activateMutation.mutate(lic.id)} className="btn-secondary py-1 px-2 text-xs" title="Activar">
                            <CheckCircle size={12} />
                          </button>
                        )}
                        {(lic.status === 'activa' || lic.status === 'vencida') && (lic as any).plan_type !== 'permanente' && lic.planType !== 'permanente' && (
                          <button onClick={() => setRenewLicense(lic)} className="btn-secondary py-1 px-2 text-xs" title="Renovar">
                            <RefreshCw size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditLicense(lic)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(lic)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252' }}
                          title="Eliminar licencia"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3">
              <Pagination page={page} total={total} limit={20} onChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Nueva Licencia" onClose={() => setShowForm(false)} size="lg">
          <LicenseForm onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['licenses'] }); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editLicense && (
        <Modal title="Editar Licencia" onClose={() => setEditLicense(null)} size="lg">
          <LicenseForm
            license={editLicense}
            onSuccess={() => { setEditLicense(null); qc.invalidateQueries({ queryKey: ['licenses'] }); }}
            onCancel={() => setEditLicense(null)}
          />
        </Modal>
      )}

      {renewLicense && (
        <Modal title="Renovar Licencia" onClose={() => setRenewLicense(null)}>
          <RenewModal license={renewLicense} onSuccess={() => { setRenewLicense(null); qc.invalidateQueries({ queryKey: ['licenses'] }); }} onCancel={() => setRenewLicense(null)} />
        </Modal>
      )}
    </div>
  );
}
