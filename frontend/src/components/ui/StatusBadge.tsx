type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';

const variantMap: Record<string, BadgeVariant> = {
  // Client status
  activo: 'green',
  inactivo: 'gray',
  prospecto: 'blue',
  suspendido: 'red',
  // License status
  activa: 'green',
  vencida: 'red',
  cancelada: 'gray',
  pendiente: 'yellow',
  // Payment status
  completado: 'green',
  fallido: 'red',
  reembolsado: 'blue',
  cancelado: 'gray',
  // Invoice status
  borrador: 'gray',
  emitida: 'blue',
  pagada: 'green',
  // Plan type
  permanente: 'green',
  mensual: 'blue',
  por_implementacion: 'yellow',
};

const labelMap: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  prospecto: 'Prospecto',
  suspendido: 'Suspendido',
  activa: 'Activa',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
  pendiente: 'Pendiente',
  completado: 'Completado',
  fallido: 'Fallido',
  reembolsado: 'Reembolsado',
  cancelado: 'Cancelado',
  borrador: 'Borrador',
  emitida: 'Emitida',
  pagada: 'Pagada',
  permanente: 'Permanente',
  mensual: 'Mensual',
  por_implementacion: 'Implementación',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = variantMap[status] || 'gray';
  const displayLabel = label || labelMap[status] || status;

  return (
    <span className={`badge badge-${variant}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {displayLabel}
    </span>
  );
}
