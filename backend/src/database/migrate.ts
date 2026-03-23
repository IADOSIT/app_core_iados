import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando migración de base de datos core_iados...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar schema
    await client.query(schema);
    console.log('✅ Schema creado exitosamente');

    // Crear usuario admin si no existe
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@iados.mx';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
         VALUES ($1, $2, 'Admin', 'iados', 1)`,
        [adminEmail, hash]
      );
      console.log(`✅ Usuario admin creado: ${adminEmail}`);
    } else {
      console.log('ℹ️  Usuario admin ya existe');
    }

    console.log('🎉 Migración completada exitosamente!');
    console.log('─────────────────────────────────────');
    console.log(`Admin Email:    ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log('─────────────────────────────────────');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
