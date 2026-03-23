import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { invoicesApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import InvoiceForm from './InvoiceForm';
import { formatDate, formatCurrency } from '../../utils/format';
import type { Invoice } from '../../types';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => invoicesApi.getAll({ page, limit: 20, status: status || undefined }),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => invoicesApi.updateStatus(id, { status: 'pagada' }),
    onSuccess: () => { toast.success('Factura marcada como pagada'); qc.invalidateQueries({ queryKey: ['invoices'] }); },
  });

  const invoices: Invoice[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturas</h1>
          <p className="page-subtitle">{total} facturas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nueva Factura
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="select h-9 text-sm w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="emitida">Emitida</option>
          <option value="pagada">Pagada</option>
          <option value="cancelada">Cancelada</option>
          <option value="vencida">Vencida</option>
        </select>
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner /> : invoices.length === 0 ? (
          <EmptyState icon={FileText} title="Sin facturas" description="Emite tu primera factura" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Nueva Factura</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Subtotal</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Moneda</th>
                  <th>Vence</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs text-primary-300">{inv.invoiceNumber}</td>
                    <td>
                      <div className="text-sm text-white">{inv.companyName || `${inv.clientFirst || ''} ${inv.clientLast || ''}`}</div>
                      <div className="text-xs text-gray-500">{inv.clientRfc}</div>
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-sm">{formatCurrency(inv.subtotal, inv.currency)}</td>
                    <td className="text-sm text-gray-400">{formatCurrency(inv.tax, inv.currency)}</td>
                    <td className="font-semibold text-white">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="text-xs">{inv.currency}</td>
                    <td className="text-xs text-gray-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                    <td>
                      {inv.status === 'emitida' && (
                        <button onClick={() => markPaid.mutate(inv.id)} className="btn-secondary py-1 px-2 text-xs">
                          Marcar Pagada
                        </button>
                      )}
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
        <Modal title="Nueva Factura" onClose={() => setShowForm(false)} size="xl">
          <InvoiceForm onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['invoices'] }); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
