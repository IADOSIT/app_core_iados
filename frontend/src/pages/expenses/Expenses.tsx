import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingDown, Trash2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { expensesApi } from '../../services/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import ExpenseForm from './ExpenseForm';
import { formatDate, formatCurrency } from '../../utils/format';
import type { Expense } from '../../types';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [year] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, year],
    queryFn: () => expensesApi.getAll({ page, limit: 20, year }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['expense-stats', year],
    queryFn: () => expensesApi.getStats(year),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => { toast.success('Gasto eliminado'); qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['expense-stats'] }); },
  });

  const expenses: Expense[] = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const stats = statsData?.data?.data;
  const byCategory = stats?.byCategory || [];
  const monthly = stats?.monthly || [];
  const summary = stats?.summary;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gastos Operativos</h1>
          <p className="page-subtitle">Control de gastos {year}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Registrar Gasto
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gastos del mes</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(summary.total_month)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gastos del año {year}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.total_year)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Por Categoría</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="total">
                  {byCategory.map((entry: { name: string; color: string }, i: number) => (
                    <Cell key={i} fill={entry.color || '#00E676'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {byCategory.map((cat: { name: string; color: string; total: number }) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                  <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text-primary)' }}>{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Gastos Mensuales {year}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" name="Gastos" fill="#FF5252" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {isLoading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <EmptyState icon={TrendingDown} title="Sin gastos" description="Registra el primer gasto operativo" action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} />Registrar Gasto</button>} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Moneda</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="text-sm" style={{ color: 'var(--text-primary)' }}>{exp.description}</td>
                    <td>
                      {exp.categoryName && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: exp.categoryColor }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{exp.categoryName}</span>
                        </div>
                      )}
                    </td>
                    <td className="font-semibold text-red-400">{formatCurrency(exp.amount, exp.currency)}</td>
                    <td className="text-xs">{exp.currency}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{exp.vendor || '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(exp.date)}</td>
                    <td>
                      <button onClick={() => deleteMutation.mutate(exp.id)} className="p-1 transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        <Trash2 size={14} />
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
        <Modal title="Registrar Gasto" onClose={() => setShowForm(false)}>
          <ExpenseForm onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['expense-stats'] }); }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
