import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CreditCard, CheckCircle, Pencil, Trash2,
  TrendingUp, TrendingDown, Users, Calendar, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { paymentsApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import PaymentForm from './PaymentForm';
import { formatDate, formatCurrency } from '../../utils/format';
import type { Payment } from '../../types';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Projection Dashboard ──────────────────────────────────────────────────────
function ProjectionDashboard() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [editTeamSize, setEditTeamSize] = useState(false);
  const [teamSizeInput, setTeamSizeInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payment-projection'],
    queryFn: () => paymentsApi.getProjection(),
    refetchInterval: 60_000,
  });

  const teamMutation = useMutation({
    mutationFn: (size: number) => paymentsApi.updateTeamSize(size),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-projection'] });
      setEditTeamSize(false);
      toast.success('Configuración guardada');
    },
  });

  if (isLoading) return <div className="card p-4"><LoadingSpinner /></div>;

  const proj = data?.data?.data;
  if (!proj) return null;

  const {
    month, year, teamSize, projectedIncome, receivedThisMonth,
    expensesThisMonth, netProjected, perPerson, paidCount, pendingCount, licenses,
  } = proj;

  const collectionPct = projectedIncome > 0 ? Math.round((receivedThisMonth / projectedIncome) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: expanded ? '1px solid var(--border-divider)' : 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Proyección — {MONTH_NAMES[month - 1]} {year}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {paidCount} pagados · {pendingCount} por cobrar · {licenses.length} mensualidades activas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Neto proyectado</p>
            <p className="text-base font-bold" style={{ color: netProjected >= 0 ? 'var(--accent)' : '#FF5252' }}>
              {formatCurrency(netProjected)}
            </p>
          </div>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Ingreso proyectado */}
            <div className="rounded-xl p-4 space-y-1" style={{ background: 'color-mix(in srgb, var(--accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ingreso proyectado</p>
              <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(projectedIncome)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{licenses.length} mensualidades</p>
            </div>
            {/* Recibido */}
            <div className="rounded-xl p-4 space-y-1" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Recibido este mes</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(receivedThisMonth)}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(collectionPct, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-emerald-400">{collectionPct}%</span>
              </div>
            </div>
            {/* Gastos */}
            <div className="rounded-xl p-4 space-y-1" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Gastos operativos</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(expensesThisMonth)}</p>
              <div className="flex items-center gap-1">
                <TrendingDown size={11} className="text-red-400" />
                <p className="text-xs text-red-400">{projectedIncome > 0 ? Math.round((expensesThisMonth / projectedIncome) * 100) : 0}% del ingreso</p>
              </div>
            </div>
            {/* Neto */}
            <div className="rounded-xl p-4 space-y-1" style={{ background: netProjected >= 0 ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'rgba(239,68,68,0.06)', border: `1px solid ${netProjected >= 0 ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'rgba(239,68,68,0.2)'}` }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Neto proyectado</p>
              <p className="text-xl font-bold" style={{ color: netProjected >= 0 ? 'var(--accent)' : '#FF5252' }}>{formatCurrency(netProjected)}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ingreso − Gastos</p>
            </div>
          </div>

          {/* Per person breakdown */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: '#818CF8' }} />
                <span className="text-sm font-semibold" style={{ color: '#818CF8' }}>Desglose por persona</span>
              </div>
              <div className="flex items-center gap-2">
                {editTeamSize ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={1} max={20}
                      className="input w-16 text-sm text-center py-1"
                      value={teamSizeInput}
                      onChange={(e) => setTeamSizeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && teamSizeInput) teamMutation.mutate(Number(teamSizeInput)); if (e.key === 'Escape') setEditTeamSize(false); }}
                      autoFocus
                    />
                    <button onClick={() => teamMutation.mutate(Number(teamSizeInput))} disabled={!teamSizeInput || teamMutation.isPending} className="btn-secondary py-1 px-2 text-xs">Guardar</button>
                    <button onClick={() => setEditTeamSize(false)} className="btn-ghost py-1 px-2 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setTeamSizeInput(String(teamSize)); setEditTeamSize(true); }} className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#818CF8' }}>
                    <Users size={11} /> {teamSize} persona{teamSize !== 1 ? 's' : ''} (editar)
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: teamSize }, (_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Persona {i + 1}</span>
                  <span className="text-sm font-bold" style={{ color: '#818CF8' }}>{formatCurrency(perPerson)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Neto {formatCurrency(netProjected)} ÷ {teamSize} = {formatCurrency(perPerson)} c/u
            </p>
          </div>

          {/* Monthly licenses table */}
          {licenses.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Mensualidades a cobrar este mes</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)' }}>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Producto / Plan</th>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Monto</th>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Corte</th>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((lic: any) => (
                      <tr key={lic.licenseId} style={{ borderTop: '1px solid var(--border-divider)' }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{lic.clientName}</td>
                        <td className="px-3 py-2.5">
                          <span style={{ color: 'var(--text-secondary)' }}>{lic.productName}</span>
                          {lic.planName && <span style={{ color: 'var(--text-muted)' }}> · {lic.planName}</span>}
                        </td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(lic.priceMxn)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                          {lic.cutoffDay ? (
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              Día {lic.cutoffDay}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {lic.status === 'pagado' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                              <CheckCircle size={10} /> Pagado
                            </span>
                          ) : lic.status === 'pendiente' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400">
                              <AlertCircle size={10} /> Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                              Sin registro
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-hover)' }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--text-primary)' }} colSpan={2}>Total proyectado</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(projectedIncome)}</td>
                      <td />
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {paidCount}/{licenses.length} cobrados
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {licenses.length === 0 && (
            <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No hay licencias mensuales activas con plan asignado.</p>
              <p className="text-xs mt-1">Asigna un plan mensual a las licencias para ver la proyección.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, status],
    queryFn: () => paymentsApi.getAll({ page, limit: 20, status: status || undefined }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.updateStatus(id, { status: 'completado', paidAt: new Date().toISOString() }),
    onSuccess: () => {
      toast.success('Pago confirmado');
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment-projection'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      toast.success('Pago eliminado');
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment-projection'] });
    },
    onError: () => toast.error('Error al eliminar el pago'),
  });

  const handleDelete = (pay: Payment) => {
    if (!window.confirm(`¿Eliminar este pago permanentemente? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate(pay.id);
  };

  const payments: Payment[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  const methodLabels: Record<string, string> = {
    transferencia: 'Transferencia', tarjeta: 'Tarjeta', efectivo: 'Efectivo',
    stripe: 'Stripe', mercadopago: 'MercadoPago', cheque: 'Cheque', otro: 'Otro',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">{total} pagos registrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Registrar Pago
        </button>
      </div>

      {/* Projection dashboard */}
      <ProjectionDashboard />

      <div className="card p-4 flex gap-3">
        <select className="select h-9 text-sm w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
          <option value="fallido">Fallido</option>
          <option value="reembolsado">Reembolsado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner /> : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="Sin pagos" description="Registra el primer pago" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Registrar Pago</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Vence</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{(pay as any).company_name || `${(pay as any).client_first || ''} ${(pay as any).client_last || ''}`.trim() || '—'}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-primary-300">{formatCurrency(pay.amount, pay.currency)}</div>
                      {pay.currency === 'USD' && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>= {formatCurrency((pay as any).amount_mxn)} MXN</div>}
                    </td>
                    <td className="text-xs">{pay.method ? methodLabels[pay.method] : '—'}</td>
                    <td><StatusBadge status={pay.status} /></td>
                    <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{(pay as any).invoice_number || '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{(pay as any).paid_at ? formatDate((pay as any).paid_at) : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{(pay as any).due_date ? formatDate((pay as any).due_date) : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {pay.status === 'pendiente' && (
                          <button onClick={() => confirmMutation.mutate(pay.id)} className="btn-secondary py-1 px-2 text-xs">
                            <CheckCircle size={12} /> Confirmar
                          </button>
                        )}
                        <button
                          onClick={() => setEditPayment(pay)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(pay)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}
                          title="Eliminar pago"
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
        <Modal title="Registrar Pago" onClose={() => setShowForm(false)} size="lg">
          <PaymentForm
            onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['payment-projection'] }); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editPayment && (
        <Modal title="Editar Pago" onClose={() => setEditPayment(null)} size="lg">
          <PaymentForm
            payment={editPayment}
            onSuccess={() => { setEditPayment(null); qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['payment-projection'] }); }}
            onCancel={() => setEditPayment(null)}
          />
        </Modal>
      )}
    </div>
  );
}
