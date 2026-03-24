export const formatCurrency = (amount: number | null | undefined, currency = 'MXN'): string => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const clientDisplayName = (client: Record<string, any>): string => {
  const company = client.companyName || client.company_name;
  const first = client.firstName || client.first_name || '';
  const last = client.lastName || client.last_name || '';
  return company || `${first} ${last}`.trim() || '—';
};
