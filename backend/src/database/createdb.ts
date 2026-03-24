import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function createDatabase() {
  // Conectar a la BD por defecto "postgres" para crear core_iados
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
  });

  await client.connect();
  console.log('✅ Conectado al servidor PostgreSQL');

  // Verificar si ya existe
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'core_iados'`);
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE core_iados');
    console.log('✅ Base de datos core_iados creada');
  } else {
    console.log('ℹ️  Base de datos core_iados ya existe');
  }

  await client.end();
}

createDatabase().catch(console.error);
