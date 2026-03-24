/**
 * Migration: Add api_slug, system_url, api_secret to products
 * Run with: npx ts-node src/database/migrate_products.ts
 */
import { pool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running products migration...');

    await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS api_slug VARCHAR(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS system_url TEXT,
        ADD COLUMN IF NOT EXISTS api_secret VARCHAR(255) DEFAULT encode(gen_random_bytes(32), 'hex');
    `);

    console.log('✅ Added api_slug, system_url, api_secret to products');

    // Also add metadata field to licenses for external tracking
    await client.query(`
      ALTER TABLE licenses
        ADD COLUMN IF NOT EXISTS domain TEXT,
        ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;
    `);

    console.log('✅ Added domain, last_heartbeat to licenses');

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
