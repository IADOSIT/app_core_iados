import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
        }}
      >
        <Icon size={28} style={{ color: 'var(--accent)', opacity: 0.7 }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p className="text-sm mb-4 max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action}
    </div>
  );
}
