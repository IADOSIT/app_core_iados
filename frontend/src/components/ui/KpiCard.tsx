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
  title, value, subtitle, icon: Icon, iconColor = '#00E676',
  trend, trendLabel, accent = '#00E676',
}: KpiCardProps) {
  const trendPositive = (trend || 0) >= 0;

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trendPositive ? (
            <TrendingUp size={13} className="text-green-400" />
          ) : (
            <TrendingDown size={13} className="text-red-400" />
          )}
          <span className={`text-xs font-medium ${trendPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trendPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
