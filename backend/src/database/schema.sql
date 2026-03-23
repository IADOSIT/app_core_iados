-- ============================================================
-- CORE IADOS CRM - Schema PostgreSQL
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES Y USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role_id INTEGER REFERENCES roles(id) DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTES
-- ============================================================

CREATE TYPE IF NOT EXISTS client_type AS ENUM ('empresa', 'persona_fisica');
CREATE TYPE IF NOT EXISTS client_status AS ENUM ('activo', 'inactivo', 'prospecto', 'suspendido');

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type client_type NOT NULL DEFAULT 'empresa',
  status client_status NOT NULL DEFAULT 'prospecto',
  -- Empresa
  company_name VARCHAR(255),
  rfc VARCHAR(20),
  industry VARCHAR(100),
  website TEXT,
  -- Persona / Contacto principal
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  -- Dirección
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'México',
  postal_code VARCHAR(10),
  -- Configuración
  profit_person_count INTEGER DEFAULT 2 CHECK (profit_person_count IN (2, 3)),
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_branches (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS Y PLANES
-- ============================================================

CREATE TYPE IF NOT EXISTS plan_type AS ENUM ('permanente', 'mensual', 'por_implementacion');
CREATE TYPE IF NOT EXISTS currency_type AS ENUM ('MXN', 'USD');

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price_mxn DECIMAL(12,2) DEFAULT 0,
  base_price_usd DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type plan_type NOT NULL,
  price_mxn DECIMAL(12,2) DEFAULT 0,
  price_usd DECIMAL(12,2) DEFAULT 0,
  max_users INTEGER,
  duration_days INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VERSIONES DE SOFTWARE
-- ============================================================

CREATE TABLE IF NOT EXISTS software_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  version VARCHAR(50) NOT NULL,
  version_name VARCHAR(255),
  release_notes TEXT,
  is_stable BOOLEAN DEFAULT true,
  is_latest BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, version)
);

CREATE TABLE IF NOT EXISTS client_version_history (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  version_id UUID REFERENCES software_versions(id),
  product_id UUID REFERENCES products(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  notes TEXT
);

-- ============================================================
-- LICENCIAS
-- ============================================================

CREATE TYPE IF NOT EXISTS license_status AS ENUM ('activa', 'vencida', 'suspendida', 'cancelada', 'pendiente');

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(255) NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id),
  product_id UUID REFERENCES products(id),
  plan_id UUID REFERENCES product_plans(id),
  version_id UUID REFERENCES software_versions(id),
  status license_status DEFAULT 'pendiente',
  max_users INTEGER DEFAULT 1,
  current_users INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  activation_date TIMESTAMPTZ,
  last_renewal_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FACTURAS
-- ============================================================

CREATE TYPE IF NOT EXISTS invoice_status AS ENUM ('borrador', 'emitida', 'pagada', 'cancelada', 'vencida');

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id),
  status invoice_status DEFAULT 'borrador',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 16,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency currency_type DEFAULT 'MXN',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  issued_at TIMESTAMPTZ,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  cfdi_uuid VARCHAR(255),
  cfdi_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 16,
  total DECIMAL(12,2) DEFAULT 0
);

-- ============================================================
-- PAGOS
-- ============================================================

CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado', 'cancelado');
CREATE TYPE IF NOT EXISTS payment_method AS ENUM ('transferencia', 'tarjeta', 'efectivo', 'stripe', 'mercadopago', 'cheque', 'otro');

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  license_id UUID REFERENCES licenses(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type DEFAULT 'MXN',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  amount_mxn DECIMAL(12,2),
  status payment_status DEFAULT 'pendiente',
  method payment_method,
  reference VARCHAR(255),
  gateway_transaction_id VARCHAR(255),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUSCRIPCIONES
-- ============================================================

CREATE TYPE IF NOT EXISTS subscription_status AS ENUM ('activa', 'pausada', 'cancelada', 'vencida');

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  license_id UUID REFERENCES licenses(id),
  plan_id UUID REFERENCES product_plans(id),
  status subscription_status DEFAULT 'activa',
  amount DECIMAL(12,2),
  currency currency_type DEFAULT 'MXN',
  billing_cycle_days INTEGER DEFAULT 30,
  next_billing_date DATE,
  last_billing_date DATE,
  gateway VARCHAR(50),
  gateway_subscription_id VARCHAR(255),
  auto_charge BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GASTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#00E676',
  icon VARCHAR(50) DEFAULT 'DollarSign',
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INTEGER REFERENCES expense_categories(id),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency currency_type DEFAULT 'MXN',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  amount_mxn DECIMAL(12,2),
  date DATE NOT NULL,
  receipt_url TEXT,
  vendor VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARGEN DE GANANCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profit_margins (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  person_count INTEGER DEFAULT 2 CHECK (person_count IN (2, 3)),
  base_cost_mxn DECIMAL(12,2) DEFAULT 0,
  base_cost_usd DECIMAL(12,2) DEFAULT 0,
  selling_price_mxn DECIMAL(12,2),
  selling_price_usd DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

CREATE TYPE IF NOT EXISTS notification_type AS ENUM (
  'licencia_vencimiento', 'pago_pendiente', 'pago_recibido',
  'cliente_nuevo', 'suscripcion_renovacion', 'sistema', 'otro'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'sistema',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  email_address VARCHAR(255),
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number VARCHAR(20),
  license_expiry_days INTEGER[] DEFAULT '{30,7,1}',
  payment_due_days INTEGER[] DEFAULT '{7,1}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_licenses_client ON licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_end_date ON licenses(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO roles (name, display_name, permissions) VALUES
  ('admin', 'Administrador', '{"all": true}'),
  ('manager', 'Gerente', '{"clients": true, "licenses": true, "payments": true, "reports": true}'),
  ('sales', 'Ventas', '{"clients": true, "licenses": "read", "payments": "read"}'),
  ('support', 'Soporte', '{"clients": "read", "licenses": "read"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO expense_categories (name, color, icon) VALUES
  ('Infraestructura', '#00E676', 'Server'),
  ('Marketing', '#69F0AE', 'TrendingUp'),
  ('Personal', '#00C853', 'Users'),
  ('Software', '#B9F6CA', 'Code'),
  ('Oficina', '#00895a', 'Building'),
  ('Viáticos', '#4CAF50', 'Car'),
  ('Otros', '#388E3C', 'MoreHorizontal')
ON CONFLICT DO NOTHING;
