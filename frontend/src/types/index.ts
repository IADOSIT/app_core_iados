// ========================
// AUTH
// ========================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  avatarUrl?: string;
  phone?: string;
  lastLogin?: string;
  roleDisplay?: string;
}

// ========================
// CLIENT
// ========================
export type ClientType = 'empresa' | 'persona_fisica';
export type ClientStatus = 'activo' | 'inactivo' | 'prospecto' | 'suspendido';

export interface Client {
  id: string;
  type: ClientType;
  status: ClientStatus;
  companyName?: string;
  rfc?: string;
  industry?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profitPersonCount?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  // Relations
  assignedFirst?: string;
  assignedLast?: string;
  activeLicenses?: number;
  pendingPayments?: number;
  contacts?: ClientContact[];
  licenses?: License[];
  payments?: Payment[];
  versionHistory?: ClientVersionHistory[];
}

export interface ClientContact {
  id: number;
  clientId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
  createdAt: string;
}

// ========================
// LICENSE
// ========================
export type LicenseStatus = 'activa' | 'vencida' | 'suspendida' | 'cancelada' | 'pendiente';

export interface License {
  id: string;
  licenseKey: string;
  clientId: string;
  productId: string;
  planId?: string;
  versionId?: string;
  status: LicenseStatus;
  maxUsers: number;
  currentUsers: number;
  startDate?: string;
  endDate?: string;
  activationDate?: string;
  autoRenew: boolean;
  notes?: string;
  daysRemaining?: number;
  createdAt: string;
  // Relations
  companyName?: string;
  clientFirst?: string;
  clientLast?: string;
  clientEmail?: string;
  productName?: string;
  planName?: string;
  planType?: string;
  version?: string;
  versionName?: string;
}

// ========================
// PRODUCT
// ========================
export type PlanType = 'permanente' | 'mensual' | 'por_implementacion';

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePriceMxn: number;
  basePriceUsd: number;
  isActive: boolean;
  plans?: ProductPlan[];
  createdAt: string;
}

export interface ProductPlan {
  id: string;
  productId: string;
  name: string;
  type: PlanType;
  priceMxn: number;
  priceUsd: number;
  maxUsers?: number;
  durationDays?: number;
  features: string[];
  isActive: boolean;
}

// ========================
// VERSION
// ========================
export interface SoftwareVersion {
  id: string;
  productId: string;
  version: string;
  versionName?: string;
  releaseNotes?: string;
  isStable: boolean;
  isLatest: boolean;
  releasedAt?: string;
  createdAt: string;
  // Relations
  productName?: string;
  licenseCount?: number;
}

export interface ClientVersionHistory {
  id: number;
  clientId: string;
  versionId: string;
  productId: string;
  assignedAt: string;
  notes?: string;
  version?: string;
  versionName?: string;
  productName?: string;
  assignedByFirst?: string;
}

// ========================
// PAYMENT
// ========================
export type PaymentStatus = 'pendiente' | 'completado' | 'fallido' | 'reembolsado' | 'cancelado';
export type PaymentMethod = 'transferencia' | 'tarjeta' | 'efectivo' | 'stripe' | 'mercadopago' | 'cheque' | 'otro';
export type CurrencyType = 'MXN' | 'USD';

export interface Payment {
  id: string;
  clientId: string;
  licenseId?: string;
  invoiceId?: string;
  amount: number;
  currency: CurrencyType;
  exchangeRate: number;
  amountMxn: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  // Relations
  companyName?: string;
  clientFirst?: string;
  clientLast?: string;
  invoiceNumber?: string;
  licenseKey?: string;
}

// ========================
// INVOICE
// ========================
export type InvoiceStatus = 'borrador' | 'emitida' | 'pagada' | 'cancelada' | 'vencida';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
  currency: CurrencyType;
  exchangeRate: number;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  cfdiUuid?: string;
  cfdiUrl?: string;
  notes?: string;
  createdAt: string;
  items?: InvoiceItem[];
  // Relations
  companyName?: string;
  clientFirst?: string;
  clientLast?: string;
  clientRfc?: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

// ========================
// EXPENSE
// ========================
export interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  categoryId?: number;
  description: string;
  amount: number;
  currency: CurrencyType;
  exchangeRate: number;
  amountMxn: number;
  date: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
  // Relations
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
}

// ========================
// DASHBOARD
// ========================
export interface DashboardKPIs {
  activeClients: number;
  activeLicenses: number;
  revenueMonth: number;
  revenueYear: number;
  pendingPayments: number;
  expiringSoon: number;
  expensesMonth: number;
  newClientsMonth: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueMonthly: { month: string; monthNum: number; total: number }[];
  clientsByStatus: { status: string; count: number }[];
  licensesByStatus: { status: string; count: number }[];
  expiringSoon: License[];
  pendingPayments: Payment[];
  recentActivity: ActivityLog[];
  topClients: { id: string; name: string; totalPaid: number; paymentCount: number }[];
  incomeVsExpenses: { monthNum: number; month: string; income: number; expenses: number; profit: number }[];
}

export interface ActivityLog {
  id: number;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

// ========================
// NOTIFICATION
// ========================
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

// ========================
// API RESPONSE
// ========================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
