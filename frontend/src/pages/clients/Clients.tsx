import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users, Building2, User, ExternalLink } from 'lucide-react';
import { clientsApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import { formatDate, clientDisplayName } from '../../utils/format';
import type { Client } from '../../types';

export default function ClientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);

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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Licencias</th>
                  <th>Pagos Pend.</th>
                  <th>Creado</th>
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
                          style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676' }}
                        >
                          {client.type === 'empresa' ? <Building2 size={14} /> : <User size={14} />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{clientDisplayName(client)}</div>
                          <div className="text-xs text-gray-500">{client.email || client.rfc || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-400 capitalize">
                        {client.type === 'empresa' ? 'Empresa' : 'Persona Física'}
                      </span>
                    </td>
                    <td><StatusBadge status={client.status} /></td>
                    <td>
                      <span className="badge badge-green">{client.activeLicenses || 0}</span>
                    </td>
                    <td>
                      {(client.pendingPayments || 0) > 0 ? (
                        <span className="badge badge-yellow">{client.pendingPayments}</span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-xs text-gray-500">{formatDate(client.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="btn-ghost py-1 px-2 text-xs"
                      >
                        <ExternalLink size={12} /> Ver
                      </button>
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
    </div>
  );
}
