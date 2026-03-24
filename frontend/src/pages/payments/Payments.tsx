import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, CheckCircle, Pencil, Trash2 } from 'lucide-react';
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
    onSuccess: () => { toast.success('Pago confirmado'); qc.invalidateQueries({ queryKey: ['payments'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => { toast.success('Pago eliminado'); qc.invalidateQueries({ queryKey: ['payments'] }); },
    onError: () => toast.error('Error al eliminar el pago'),
  });

  const handleDelete = (pay: Payment) => {
    if (!window.confirm(`¿Eliminar este pago permanentemente? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate(pay.id);
  };

  const payments: Payment[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  const methodLabels: Record<string, string> = {
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    efectivo: 'Efectivo',
    stripe: 'Stripe',
    mercadopago: 'MercadoPago',
    cheque: 'Cheque',
    otro: 'Otro',
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
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{((pay as any).paid_at) ? formatDate((pay as any).paid_at) : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{((pay as any).due_date) ? formatDate((pay as any).due_date) : '—'}</td>
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
          <PaymentForm onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['payments'] }); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editPayment && (
        <Modal title="Editar Pago" onClose={() => setEditPayment(null)} size="lg">
          <PaymentForm
            payment={editPayment}
            onSuccess={() => { setEditPayment(null); qc.invalidateQueries({ queryKey: ['payments'] }); }}
            onCancel={() => setEditPayment(null)}
          />
        </Modal>
      )}
    </div>
  );
}
