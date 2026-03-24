import { useQuery } from '@tanstack/react-query';
import {
  Users, Key, DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  Package, Clock, CreditCard, Activity, ExternalLink,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useThemeStore } from '../../store/themeStore';
import type { DashboardData } from '../../types';
import { formatCurrency } from '../../utils/format';

const COLORS = ['#00C853', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#607D8B'];
const STATUS_COLORS: Record<string, string> = {
  activo: '#00C853', inactivo: '#607D8B', prospecto: '#2196F3', suspendido: '#FF5252',
  activa: '#00C853', vencida: '#FF5252', cancelada: '#607D8B', pendiente: '#FFC107',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs"
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border-surface)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const tickColor = isDark ? '#9CA3AF' : '#374151';   // light: #374151 = bien visible sobre blanco
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner />;

  const dash: DashboardData = data?.data?.data;
  if (!dash) return null;

  const { kpis, clientsByStatus, licensesByStatus, expiringSoon, pendingPayments, topClients, incomeVsExpenses, productStats = [] } = dash;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen ejecutivo en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
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
          iconColor="var(--accent)"
        />
        <KpiCard
          title="Licencias Activas"
          value={kpis.activeLicenses}
          subtitle={`${kpis.expiringSoon} por vencer`}
          icon={Key}
          iconColor="#4CAF50"
        />
        <KpiCard
          title="Ingresos del Mes"
          value={formatCurrency(kpis.revenueMonth)}
          subtitle="MXN"
          icon={DollarSign}
          iconColor="var(--accent)"
        />
        <KpiCard
          title="Ingresos del Año"
          value={formatCurrency(kpis.revenueYear)}
          subtitle="MXN acumulado"
          icon={TrendingUp}
          iconColor="#2196F3"
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
          iconColor="var(--accent)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos vs Gastos */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>
            Ingresos vs Gastos — {new Date().getFullYear()}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={incomeVsExpenses}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5252" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF5252" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: tickColor }} />
              <Area type="monotone" dataKey="income" name="Ingresos" stroke="#00C853" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#FF5252" fill="url(#expensesGrad)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#2196F3" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Clientes por status */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Estado de Clientes</h3>
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
                <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{item.status}</span>
                <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Clientes */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Top 5 Clientes por Ingresos</h3>
          <div className="space-y-3">
            {topClients.map((client, i) => {
              const max = topClients[0]?.totalPaid || 1;
              const pct = (client.totalPaid / max) * 100;
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                      <span className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>{client.name}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(client.totalPaid)}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))' }}
                    />
                  </div>
                </div>
              );
            })}
            {topClients.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Licencias por status */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Estado de Licencias</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={licensesByStatus} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="status" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} />
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

      {/* Products Dashboard */}
      {productStats.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Package size={15} style={{ color: 'var(--accent)' }} />
              Dashboard de Productos / Sistemas
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {productStats.map((p: any, i: number) => {
              const color = COLORS[i % COLORS.length];
              const maxLic = Math.max(...productStats.map((x: any) => Number(x.active_licenses) || 0), 1);
              const pct = Math.round((Number(p.active_licenses) / maxLic) * 100);
              return (
                <div
                  key={p.id}
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                >
                  {/* Product name + link */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <Package size={14} style={{ color }} />
                    </div>
                    {p.system_url && (
                      <a href={p.system_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 hover:underline flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>Lic. activas</p>
                      <p className="font-bold text-lg leading-tight" style={{ color }}>{p.active_licenses ?? 0}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }}>Clientes</p>
                      <p className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{p.active_clients ?? 0}</p>
                    </div>
                  </div>

                  {/* License bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      <span>Participación</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="pt-1 border-t" style={{ borderColor: 'var(--border-divider)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ingresos este mes</p>
                    <p className="text-sm font-semibold" style={{ color }}>{formatCurrency(Number(p.revenue_month))}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar chart comparativo */}
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={productStats.map((p: any) => ({
                name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
                'Lic. activas': Number(p.active_licenses) || 0,
                'Ingresos mes': Number(p.revenue_month) || 0,
              }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: tickColor }} />
                <Bar dataKey="Lic. activas" fill="var(--accent)" radius={[4,4,0,0]} />
                <Bar dataKey="Ingresos mes" fill="#2196F3" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Licencias por vencer */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle size={15} className="text-yellow-500" />
              Licencias por Vencer (30 días)
            </h3>
            <span className="badge badge-yellow">{expiringSoon.length}</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {expiringSoon.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin licencias por vencer</p>
            ) : (
              expiringSoon.map((lic) => (
                <div
                  key={lic.id}
                  className="flex items-center justify-between py-2 last:border-0"
                  style={{ borderBottom: '1px solid var(--border-divider)' }}
                >
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {lic.companyName || `${lic.clientFirst} ${lic.clientLast}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lic.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: (lic.daysRemaining || 0) <= 7 ? '#FF5252' : '#FFC107' }}>
                      {lic.daysRemaining} días
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lic.endDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock size={15} className="text-orange-400" />
              Pagos Pendientes
            </h3>
            <span className="badge badge-yellow">{pendingPayments.length}</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin pagos pendientes</p>
            ) : (
              pendingPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between py-2 last:border-0"
                  style={{ borderBottom: '1px solid var(--border-divider)' }}
                >
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {pay.companyName || `${pay.clientFirst} ${pay.clientLast}`}
                    </p>
                    {pay.dueDate && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vence: {pay.dueDate}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(pay.amountMxn)}</p>
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
