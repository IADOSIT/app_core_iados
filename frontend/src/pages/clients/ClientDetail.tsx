import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Edit, Building2, User, Key, CreditCard,
  GitBranch, Phone, Mail, Globe, MapPin, Plus,
} from 'lucide-react';
import { clientsApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import { formatDate, formatCurrency, clientDisplayName } from '../../utils/format';
import type { Client } from '../../types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<'overview' | 'licenses' | 'payments' | 'versions'>('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getOne(id!),
  });

  if (isLoading) return <LoadingSpinner />;

  const client: Client = data?.data?.data;
  if (!client) return null;

  const tabs = [
    { key: 'overview', label: 'Información', icon: Building2 },
    { key: 'licenses', label: `Licencias (${client.licenses?.length || 0})`, icon: Key },
    { key: 'payments', label: `Pagos (${client.payments?.length || 0})`, icon: CreditCard },
    { key: 'versions', label: `Versiones (${client.versionHistory?.length || 0})`, icon: GitBranch },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="btn-ghost py-2 px-3">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              {client.type === 'empresa' ? <Building2 size={20} style={{ color: 'var(--accent)' }} /> : <User size={20} style={{ color: 'var(--accent)' }} />}
            </div>
            <div>
              <h1 className="page-title">{clientDisplayName(client)}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={client.status} />
                <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{client.type === 'empresa' ? 'Empresa' : 'Persona Física'}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} className="btn-secondary">
          <Edit size={15} /> Editar
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-300">{client.activeLicenses || 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Licencias Activas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{client.pendingPayments || 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pagos Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{client.contacts?.length || 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Contactos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
            style={tab === key ? { background: 'linear-gradient(135deg,#00E676,#00C853)', color: 'var(--accent-btn-text)' } : { color: 'var(--text-muted)' }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Información de Contacto</h3>
            <div className="space-y-2.5">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{client.phone}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary-300 hover:underline">{client.website}</a>
                </div>
              )}
              {(client.city || client.state) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{[client.city, client.state, client.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            {client.rfc && (
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>RFC</p>
                <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>{client.rfc}</p>
              </div>
            )}

            {client.notes && (
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Notas</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{client.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Contactos Adicionales</h3>
            {client.contacts && client.contacts.length > 0 ? (
              <div className="space-y-2">
                {client.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-start justify-between py-2 last:border-0" style={{ borderBottom: '1px solid var(--border-divider)' }}>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{contact.position}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{contact.email}</p>
                    </div>
                    {contact.isPrimary && <span className="badge badge-green text-xs">Principal</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin contactos adicionales</p>
            )}
          </div>
        </div>
      )}

      {tab === 'licenses' && (
        <div className="card">
          {(client.licenses?.length || 0) === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin licencias asignadas</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Clave</th>
                    <th>Producto</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Usuarios</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {client.licenses?.map((lic) => (
                    <tr key={lic.id}>
                      <td className="font-mono text-xs text-primary-300">{lic.licenseKey}</td>
                      <td className="text-sm">{lic.productName}</td>
                      <td><StatusBadge status={lic.planType || ''} /></td>
                      <td><StatusBadge status={lic.status} /></td>
                      <td className="text-xs">{lic.currentUsers}/{lic.maxUsers}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{lic.endDate ? formatDate(lic.endDate) : 'Permanente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="card">
          {(client.payments?.length || 0) === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin pagos registrados</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Monto</th>
                    <th>Moneda</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {client.payments?.map((pay) => (
                    <tr key={pay.id}>
                      <td className="font-semibold text-primary-300">{formatCurrency(pay.amount, pay.currency)}</td>
                      <td className="text-xs">{pay.currency}</td>
                      <td className="text-xs capitalize">{pay.method || '—'}</td>
                      <td><StatusBadge status={pay.status} /></td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{pay.paidAt ? formatDate(pay.paidAt) : formatDate(pay.createdAt)}</td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{pay.reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'versions' && (
        <div className="card">
          {(client.versionHistory?.length || 0) === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin historial de versiones</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Versión</th>
                    <th>Producto</th>
                    <th>Asignado por</th>
                    <th>Fecha</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {client.versionHistory?.map((vh) => (
                    <tr key={vh.id}>
                      <td className="font-mono text-xs text-primary-300">{vh.version}</td>
                      <td className="text-sm">{vh.productName}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{vh.assignedByFirst || '—'}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(vh.assignedAt)}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{vh.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <Modal title="Editar Cliente" onClose={() => setEditOpen(false)} size="lg">
          <ClientForm
            client={client}
            onSuccess={() => {
              setEditOpen(false);
              qc.invalidateQueries({ queryKey: ['client', id] });
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
