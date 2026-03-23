import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { dashboardApi, paymentsApi, expensesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#1A1A24', border: '1px solid rgba(0,230,118,0.2)' }}>
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const { data: profitData, isLoading: l1 } = useQuery({
    queryKey: ['profit-report', year],
    queryFn: () => dashboardApi.getProfit(year),
  });

  const { data: payStats, isLoading: l2 } = useQuery({
    queryKey: ['payment-stats', year],
    queryFn: () => paymentsApi.getStats(year),
  });

  const { data: expStats, isLoading: l3 } = useQuery({
    queryKey: ['expense-stats-report', year],
    queryFn: () => expensesApi.getStats(year),
  });

  const profit = profitData?.data?.data || [];
  const payByMethod = payStats?.data?.data?.byMethod || [];
  const expByCategory = expStats?.data?.data?.byCategory || [];
  const expMonthly = expStats?.data?.data?.monthly || [];

  const totalIncome = profit.reduce((s: number, m: { income: number }) => s + m.income, 0);
  const totalExpenses = profit.reduce((s: number, m: { expenses: number }) => s + m.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const marginPct = totalIncome > 0 ? Math.round((totalProfit / totalIncome) * 100) : 0;

  if (l1 || l2 || l3) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes & Analítica</h1>
          <p className="page-subtitle">Análisis financiero detallado</p>
        </div>
        <select
          className="select h-9 text-sm w-32"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos Totales', value: formatCurrency(totalIncome), color: '#00E676' },
          { label: 'Gastos Totales', value: formatCurrency(totalExpenses), color: '#FF5252' },
          { label: 'Ganancia Neta', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? '#00E676' : '#FF5252' },
          { label: 'Margen de Ganancia', value: `${marginPct}%`, color: marginPct >= 30 ? '#00E676' : marginPct >= 10 ? '#FFC107' : '#FF5252' },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Ganancia mensual */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Ingresos, Gastos y Ganancia — {year}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={profit} barGap={4}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00C853" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5252" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#D32F2F" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
            <Bar dataKey="income" name="Ingresos" fill="url(#incGrad)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Gastos" fill="url(#expGrad)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#69F0AE" strokeWidth={2} dot={{ fill: '#69F0AE', r: 3 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Margen mensual */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Margen de Ganancia Mensual (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={profit}>
            <defs>
              <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="margin_pct" name="Margen %" stroke="#00E676" fill="url(#marginGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Por método pago y por categoría gasto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ingresos por Método de Pago</h3>
          {payByMethod.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {payByMethod.map((item: { method: string; total: number; count: number }, i: number) => {
                const max = payByMethod[0]?.total || 1;
                const pct = (item.total / max) * 100;
                const colors = ['#00E676', '#69F0AE', '#00C853', '#009624', '#B9F6CA'];
                return (
                  <div key={item.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 capitalize">{item.method || 'Sin especificar'}</span>
                      <span className="text-xs font-semibold text-primary-300">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.count} transacciones</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por Categoría</h3>
          {expByCategory.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {expByCategory.map((item: { name: string; color: string; total: number }) => {
                const max = expByCategory[0]?.total || 1;
                const pct = (item.total / max) * 100;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-red-400">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
