import { pool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

async function migrateProspects() {
  const client = await pool.connect();
  try {
    console.log('🚀 Creando tablas de prospectos...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS prospects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        source VARCHAR(50) DEFAULT 'directo',
        status VARCHAR(50) DEFAULT 'nuevo',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS prospect_quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
        quote_number VARCHAR(50),
        products_description TEXT,
        implementation_fee NUMERIC(12,2) DEFAULT 0,
        license_fee NUMERIC(12,2) DEFAULT 0,
        monthly_fee NUMERIC(12,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'MXN',
        exchange_rate NUMERIC(10,4) DEFAULT 1,
        validity_date DATE,
        status VARCHAR(50) DEFAULT 'borrador',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      );
    `);

    console.log('✅ Tablas prospects y prospect_quotes creadas');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateProspects();
