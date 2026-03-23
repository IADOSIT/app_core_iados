import { useQuery } from '@tanstack/react-query';
import {
  Users, Key, DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  Package, Clock, CreditCard, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { DashboardData } from '../../types';
import { formatCurrency } from '../../utils/format';

const COLORS = ['#00E676', '#69F0AE', '#00C853', '#009624', '#B9F6CA', '#4CAF50'];
const STATUS_COLORS: Record<string, string> = {
  activo: '#00E676', inactivo: '#607D8B', prospecto: '#2196F3', suspendido: '#FF5252',
  activa: '#00E676', vencida: '#FF5252', cancelada: '#607D8B', pendiente: '#FFC107',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#1A1A24', border: '1px solid rgba(0,230,118,0.2)' }}>
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner />;

  const dash: DashboardData = data?.data?.data;
  if (!dash) return null;

  const { kpis, revenueMonthly, clientsByStatus, licensesByStatus, expiringSoon, pendingPayments, topClients, incomeVsExpenses } = dash;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen ejecutivo en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="glow-dot" />
          Actualización automática cada 60s
        </div>
      </div>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Clientes Activos"
          value={kpis.activeClients}
          subtitle={`+${kpis.newClientsMonth} este mes`}
          icon={Users}
          iconColor="#00E676"
        />
        <KpiCard
          title="Licencias Activas"
          value={kpis.activeLicenses}
          subtitle={`${kpis.expiringSoon} por vencer`}
          icon={Key}
          iconColor="#69F0AE"
        />
        <KpiCard
          title="Ingresos del Mes"
          value={formatCurrency(kpis.revenueMonth)}
          subtitle="MXN"
          icon={DollarSign}
          iconColor="#00C853"
        />
        <KpiCard
          title="Ingresos del Año"
          value={formatCurrency(kpis.revenueYear)}
          subtitle="MXN acumulado"
          icon={TrendingUp}
          iconColor="#B9F6CA"
        />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pagos Pendientes"
          value={kpis.pendingPayments}
          subtitle="Por confirmar"
          icon={CreditCard}
          iconColor="#FFC107"
        />
        <KpiCard
          title="Licencias por Vencer"
          value={kpis.expiringSoon}
          subtitle="Próximos 30 días"
          icon={AlertTriangle}
          iconColor="#FF5252"
        />
        <KpiCard
          title="Gastos del Mes"
          value={formatCurrency(kpis.expensesMonth)}
          subtitle="MXN"
          icon={TrendingDown}
          iconColor="#FF7043"
        />
        <KpiCard
          title="Ganancia Neta"
          value={formatCurrency(kpis.revenueMonth - kpis.expensesMonth)}
          subtitle={`${kpis.revenueMonth > 0 ? Math.round(((kpis.revenueMonth - kpis.expensesMonth) / kpis.revenueMonth) * 100) : 0}% margen`}
          icon={Activity}
          iconColor="#00E676"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos vs Gastos */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 text-sm">Ingresos vs Gastos — {new Date().getFullYear()}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeVsExpenses}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5252" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF5252" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              <Area type="monotone" dataKey="income" name="Ingresos" stroke="#00E676" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#FF5252" fill="url(#expensesGrad)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#69F0AE" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Clientes por status */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Estado de Clientes</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={clientsByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="count">
                {clientsByStatus.map((entry, i) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {clientsByStatus.map((item, i) => (
              <div key={item.status} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[item.status] || COLORS[i] }} />
                <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                <span className="text-xs font-semibold text-white ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Clientes */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Top 5 Clientes por Ingresos</h3>
          <div className="space-y-3">
            {topClients.map((client, i) => {
              const max = topClients[0]?.totalPaid || 1;
              const pct = (client.totalPaid / max) * 100;
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">#{i + 1}</span>
                      <span className="text-xs text-white truncate max-w-[140px]">{client.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary-300">{formatCurrency(client.totalPaid)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#00E676,#00C853)' }}
                    />
                  </div>
                </div>
              );
            })}
            {topClients.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Sin datos aún</p>}
          </div>
        </div>

        {/* Licencias por status */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Estado de Licencias</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={licensesByStatus} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Cantidad" radius={[4, 4, 0, 0]}>
                {licensesByStatus.map((entry, i) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Licencias por vencer */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <AlertTriangle size={15} className="text-yellow-400" />
              Licencias por Vencer (30 días)
            </h3>
            <span className="badge badge-yellow">{expiringSoon.length}</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {expiringSoon.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Sin licencias por vencer</p>
            ) : (
              expiringSoon.map((lic) => (
                <div key={lic.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white">{lic.companyName || `${lic.clientFirst} ${lic.clientLast}`}</p>
                    <p className="text-xs text-gray-500">{lic.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: (lic.daysRemaining || 0) <= 7 ? '#FF5252' : '#FFC107' }}>
                      {lic.daysRemaining} días
                    </p>
                    <p className="text-xs text-gray-500">{lic.endDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Clock size={15} className="text-orange-400" />
              Pagos Pendientes
            </h3>
            <span className="badge badge-yellow">{pendingPayments.length}</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Sin pagos pendientes</p>
            ) : (
              pendingPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white">{pay.companyName || `${pay.clientFirst} ${pay.clientLast}`}</p>
                    {pay.dueDate && <p className="text-xs text-gray-500">Vence: {pay.dueDate}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary-300">{formatCurrency(pay.amountMxn)}</p>
                    <StatusBadge status={pay.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
