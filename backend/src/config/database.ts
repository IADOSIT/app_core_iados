import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config: PoolConfig = {
  host: process.env.DB_HOST || 'pg.bodegadigital.com.mx',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'core_iados',
  user: process.env.DB_USER || 'administrador',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(config);

pool.on('connect', () => {
  console.log('✅ PostgreSQL conectado - core_iados');
});

pool.on('error', (err) => {
  console.error('❌ Error en pool PostgreSQL:', err);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Query ejecutada', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
};

export const getClient = () => pool.connect();

export default pool;
