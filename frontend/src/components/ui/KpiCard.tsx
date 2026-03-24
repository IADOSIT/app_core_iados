import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  accent?: string;
}

export default function KpiCard({
  title, value, subtitle, icon: Icon, iconColor = 'var(--accent)',
  trend, trendLabel,
}: KpiCardProps) {
  const trendPositive = (trend || 0) >= 0;

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${iconColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${iconColor} 25%, transparent)` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trendPositive ? (
            <TrendingUp size={13} className="text-green-500" />
          ) : (
            <TrendingDown size={13} className="text-red-400" />
          )}
          <span className={`text-xs font-medium ${trendPositive ? 'text-green-500' : 'text-red-400'}`}>
            {trendPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
