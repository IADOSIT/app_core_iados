import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Building2, User, ExternalLink, Pencil, Package, Lock, Eye, EyeOff, Trash2, Calendar, CalendarCheck } from 'lucide-react';
import { clientsApi } from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import { formatDate, clientDisplayName } from '../../utils/format';
import type { Client } from '../../types';

function ClientVaultBadge({ clientId, adminUser, hasAdminPassword }: { clientId: string; adminUser?: string; hasAdminPassword?: boolean }) {
  const [pwd, setPwd] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  if (!adminUser && !hasAdminPassword) return null;

  const reveal = async () => {
    if (pwd !== null) { setShow(!show); return; }
    try {
      const res = await clientsApi.revealPassword(clientId);
      setPwd(res.data.password || '');
      setShow(true);
    } catch { toast.error('Sin permiso para ver contraseña'); }
  };

  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      {adminUser && (
        <span className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Lock size={10} style={{ color: '#F59E0B' }} /> {adminUser}
        </span>
      )}
      {hasAdminPassword && (
        <button onClick={reveal} className="text-xs flex items-center gap-0.5 transition-colors hover:underline" style={{ color: '#F59E0B' }}>
          {show ? <EyeOff size={10} /> : <Eye size={10} />}
          {pwd !== null ? (show ? <code className="font-mono">{pwd}</code> : '••••') : 'Ver pwd'}
        </button>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => { toast.success('Cliente eliminado'); qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: () => toast.error('Error al eliminar cliente'),
  });

  const handleDelete = (client: Client) => {
    const name = clientDisplayName(client as any);
    if (!window.confirm(`¿Eliminar permanentemente a "${name}"?\n\nSe eliminarán también sus licencias, pagos y facturas. Esta acción NO se puede deshacer.`)) return;
    deleteMutation.mutate(client.id);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, status, type],
    queryFn: () => clientsApi.getAll({ page, limit: 20, search: search || undefined, status: status || undefined, type: type || undefined }),
  });

  const clients: Client[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{total} clientes registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, email..."
            className="input pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="select h-9 text-sm w-40"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="prospecto">Prospecto</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
        </select>
        <select
          className="select h-9 text-sm w-36"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        >
          <option value="">Todos los tipos</option>
          <option value="empresa">Empresa</option>
          <option value="persona_fisica">Persona Física</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <LoadingSpinner />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin clientes registrados"
            description="Agrega tu primer cliente para comenzar"
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={15} /> Agregar Cliente
              </button>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Sistema(s) activo(s)</th>
                  <th>Estado</th>
                  <th>Corte / Inicio</th>
                  <th>Pagos Pend.</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--accent)' }}
                        >
                          {client.type === 'empresa' ? <Building2 size={14} /> : <User size={14} />}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{clientDisplayName(client)}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{client.email || client.rfc || '—'}</div>
                          <ClientVaultBadge
                            clientId={client.id}
                            adminUser={(client as any).admin_user}
                            hasAdminPassword={(client as any).has_admin_password}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const activeProds = (client as any).active_products || (client as any).activeProducts;
                        if (!activeProds?.length) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin licencias activas</span>;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {activeProds.map((ap: { productId: string; productName: string; systemUrl?: string; status: string }) => (
                              <a
                                key={ap.productId}
                                href={ap.systemUrl || '#'}
                                target={ap.systemUrl ? '_blank' : undefined}
                                rel="noopener noreferrer"
                                title={ap.systemUrl || ap.productName}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                                style={{
                                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                  color: 'var(--accent)',
                                  border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                                  textDecoration: 'none',
                                }}
                              >
                                <Package size={10} />
                                {ap.productName}
                                {ap.systemUrl && <ExternalLink size={9} />}
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td><StatusBadge status={client.status} /></td>
                    <td>
                      <div className="space-y-0.5">
                        {(client as any).payment_cutoff_day && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <Calendar size={10} style={{ color: '#F59E0B', flexShrink: 0 }} />
                            Día {(client as any).payment_cutoff_day}
                          </div>
                        )}
                        {(client as any).formal_start_date && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <CalendarCheck size={10} style={{ flexShrink: 0 }} />
                            {formatDate((client as any).formal_start_date)}
                          </div>
                        )}
                        {(client as any).demo_end_date && new Date((client as any).demo_end_date) > new Date() && (
                          <span className="badge badge-blue text-xs">Demo activo</span>
                        )}
                        {!(client as any).payment_cutoff_day && !(client as any).formal_start_date && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {((client as any).pending_payments ?? client.pendingPayments ?? 0) > 0 ? (
                        <span className="badge badge-yellow">{(client as any).pending_payments ?? client.pendingPayments}</span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate((client as any).created_at || client.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="btn-ghost py-1 px-2 text-xs"
                        >
                          <ExternalLink size={12} /> Ver
                        </button>
                        <button
                          onClick={() => setEditClient(client)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                          title="Editar cliente"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                          title="Eliminar cliente"
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
        <Modal title="Nuevo Cliente" onClose={() => setShowForm(false)} size="lg">
          <ClientForm
            onSuccess={() => {
              setShowForm(false);
              qc.invalidateQueries({ queryKey: ['clients'] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editClient && (
        <Modal title="Editar Cliente" onClose={() => setEditClient(null)} size="lg">
          <ClientForm
            client={editClient}
            onSuccess={() => {
              setEditClient(null);
              qc.invalidateQueries({ queryKey: ['clients'] });
            }}
            onCancel={() => setEditClient(null)}
          />
        </Modal>
      )}
    </div>
  );
}
