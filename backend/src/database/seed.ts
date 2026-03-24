/**
 * Seed: Inserta los 4 sistemas iados + cliente de prueba + licencias activas
 * Run with: npx ts-node src/database/seed.ts
 */
import { pool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding iados systems...\n');

    // ─── 1. PRODUCTOS ────────────────────────────────────────────────
    const products = [
      {
        name: 'Acceso Digital iados',
        description: 'Sistema de control de acceso y asistencia con reconocimiento facial y lector de QR/RFID.',
        base_price_mxn: 3500,
        base_price_usd: 199,
        api_slug: 'acceso-digital',
        system_url: 'https://accesodigital.iados.mx',
        plans: [
          { name: 'Mensual', type: 'mensual', price_mxn: 850, price_usd: 49, max_users: 5, duration_days: 30,
            features: ['Control de acceso QR', 'Reportes básicos', 'Hasta 5 usuarios', 'Soporte por correo'] },
          { name: 'Anual', type: 'mensual', price_mxn: 8500, price_usd: 490, max_users: 20, duration_days: 365,
            features: ['Control de acceso QR + RFID', 'Reconocimiento facial', 'Reportes avanzados', 'Hasta 20 usuarios', 'Soporte prioritario'] },
          { name: 'Permanente', type: 'permanente', price_mxn: 18000, price_usd: 999, max_users: null, duration_days: null,
            features: ['Todo incluido', 'Usuarios ilimitados', 'Actualizaciones de por vida', 'Soporte dedicado'] },
        ],
        version: '2.4.1',
        version_name: 'Polaris',
      },
      {
        name: 'POS iados',
        description: 'Punto de venta con facturación CFDI 4.0, inventario, ventas a crédito y reportes de caja.',
        base_price_mxn: 4500,
        base_price_usd: 249,
        api_slug: 'pos',
        system_url: 'https://pos.iados.mx',
        plans: [
          { name: 'Mensual', type: 'mensual', price_mxn: 1100, price_usd: 59, max_users: 3, duration_days: 30,
            features: ['Hasta 1 terminal', 'Facturación CFDI 4.0', 'Inventario básico', '3 usuarios'] },
          { name: 'Anual', type: 'mensual', price_mxn: 10500, price_usd: 580, max_users: 10, duration_days: 365,
            features: ['Hasta 3 terminales', 'CFDI 4.0 + e-mail automático', 'Inventario avanzado', 'Cuentas por cobrar', '10 usuarios'] },
          { name: 'Permanente', type: 'permanente', price_mxn: 22000, price_usd: 1199, max_users: null, duration_days: null,
            features: ['Terminales ilimitadas', 'Multisucursal', 'Usuarios ilimitados', 'Soporte dedicado', 'Actualizaciones lifetime'] },
        ],
        version: '3.1.0',
        version_name: 'Vega',
      },
      {
        name: 'FitControl',
        description: 'Gestión integral de gimnasios y estudios fitness: membresías, acceso, clases y cobranza.',
        base_price_mxn: 2800,
        base_price_usd: 159,
        api_slug: 'fitcontrol',
        system_url: 'https://fitcontrol.iados.online',
        plans: [
          { name: 'Básico', type: 'mensual', price_mxn: 699, price_usd: 39, max_users: 3, duration_days: 30,
            features: ['Hasta 100 socios', 'Control de membresías', 'Acceso por QR', '3 usuarios staff'] },
          { name: 'Pro', type: 'mensual', price_mxn: 1299, price_usd: 69, max_users: 10, duration_days: 30,
            features: ['Socios ilimitados', 'Clases grupales', 'App para socios', 'Cobranza automática', '10 usuarios staff'] },
          { name: 'Por Implementación', type: 'por_implementacion', price_mxn: 9500, price_usd: 520, max_users: null, duration_days: null,
            features: ['Instalación y configuración', 'Migración de datos', 'Capacitación on-site', 'Garantía 6 meses'] },
        ],
        version: '1.8.3',
        version_name: 'Atlas',
      },
      {
        name: 'CFDI Check',
        description: 'Validación y consulta masiva de CFDIs ante el SAT. Descarga XML, PDF y verificación de estatus.',
        base_price_mxn: 1500,
        base_price_usd: 89,
        api_slug: 'cfdi-check',
        system_url: 'https://cfdicheck.iados.online',
        plans: [
          { name: 'Starter', type: 'mensual', price_mxn: 350, price_usd: 19, max_users: 2, duration_days: 30,
            features: ['Hasta 500 CFDIs/mes', 'Descarga XML/PDF', '2 RFCs', '2 usuarios'] },
          { name: 'Business', type: 'mensual', price_mxn: 899, price_usd: 49, max_users: 5, duration_days: 30,
            features: ['CFDIs ilimitados', 'Descarga masiva', 'RFCs ilimitados', 'API access', '5 usuarios'] },
          { name: 'Anual Business', type: 'mensual', price_mxn: 8500, price_usd: 460, max_users: 10, duration_days: 365,
            features: ['Todo de Business', 'Precio reducido', 'Prioridad de soporte', '10 usuarios'] },
        ],
        version: '1.2.7',
        version_name: 'Sirius',
      },
    ];

    const productIds: Record<string, string> = {};
    const planIds: Record<string, string> = {};
    const versionIds: Record<string, string> = {};

    for (const product of products) {
      // Insert product
      const pRes = await client.query(
        `INSERT INTO products (name, description, base_price_mxn, base_price_usd, api_slug, system_url)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (api_slug) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description,
           base_price_mxn=EXCLUDED.base_price_mxn, base_price_usd=EXCLUDED.base_price_usd,
           system_url=EXCLUDED.system_url
         RETURNING id`,
        [product.name, product.description, product.base_price_mxn, product.base_price_usd, product.api_slug, product.system_url]
      );
      const productId = pRes.rows[0].id;
      productIds[product.api_slug] = productId;
      console.log(`✅ Producto: ${product.name} [${productId}]`);

      // Insert plans
      for (const plan of product.plans) {
        const planRes = await client.query(
          `INSERT INTO product_plans (product_id, name, type, price_mxn, price_usd, max_users, duration_days, features)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT DO NOTHING RETURNING id`,
          [productId, plan.name, plan.type, plan.price_mxn, plan.price_usd, plan.max_users, plan.duration_days, JSON.stringify(plan.features)]
        );
        if (planRes.rows[0]) {
          planIds[`${product.api_slug}-${plan.name}`] = planRes.rows[0].id;
        } else {
          // Get existing plan id
          const existRes = await client.query(
            'SELECT id FROM product_plans WHERE product_id=$1 AND name=$2 LIMIT 1',
            [productId, plan.name]
          );
          if (existRes.rows[0]) planIds[`${product.api_slug}-${plan.name}`] = existRes.rows[0].id;
        }
      }

      // Insert version
      const vRes = await client.query(
        `INSERT INTO software_versions (product_id, version, version_name, is_stable, is_latest, released_at)
         VALUES ($1,$2,$3,true,true,NOW())
         ON CONFLICT (product_id, version) DO UPDATE SET version_name=EXCLUDED.version_name, is_latest=true
         RETURNING id`,
        [productId, product.version, product.version_name]
      );
      versionIds[product.api_slug] = vRes.rows[0].id;
      console.log(`   📦 Plan(s): ${product.plans.length} | Versión: ${product.version} ${product.version_name}`);
    }

    // ─── 2. CLIENTE DE PRUEBA ─────────────────────────────────────────
    const adminRes = await client.query("SELECT id FROM users WHERE email='admin@iados.mx' LIMIT 1");
    const adminId = adminRes.rows[0]?.id;

    const clientRes = await client.query(
      `INSERT INTO clients (
         type, status, company_name, rfc, industry, website,
         email, phone, whatsapp, address, city, state, country, postal_code,
         profit_person_count, assigned_to, notes
       ) VALUES (
         'empresa','activo','Grupo Empresarial Demo S.A. de C.V.','GED991231ABC','Tecnología','https://demo.iados.mx',
         'contacto@demo.iados.mx','+52 55 1234 5678','+52 55 1234 5678',
         'Av. Insurgentes Sur 1234, Piso 8',
         'Ciudad de México','CDMX','México','03100',
         2,$1,'Cliente de prueba con todos los sistemas iados activos. Generado automáticamente por seed.'
       ) ON CONFLICT DO NOTHING RETURNING id`,
      [adminId]
    );

    let testClientId: string;
    if (clientRes.rows[0]) {
      testClientId = clientRes.rows[0].id;
      console.log(`\n✅ Cliente: Grupo Empresarial Demo S.A. de C.V. [${testClientId}]`);

      // Add primary contact
      await client.query(
        `INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, position, is_primary)
         VALUES ($1,'Carlos','Ramírez López','carlos.ramirez@demo.iados.mx','+52 55 1234 5679','Director de TI',true)`,
        [testClientId]
      );
      await client.query(
        `INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, position, is_primary)
         VALUES ($1,'Ana','García Moreno','ana.garcia@demo.iados.mx','+52 55 1234 5680','Administración',false)`,
        [testClientId]
      );
      console.log('   👤 Contactos: Carlos Ramírez (Director TI), Ana García (Admin)');
    } else {
      const existing = await client.query(
        "SELECT id FROM clients WHERE company_name='Grupo Empresarial Demo S.A. de C.V.' LIMIT 1"
      );
      testClientId = existing.rows[0].id;
      console.log(`\n⚠️  Cliente ya existe [${testClientId}]`);
    }

    // ─── 3. LICENCIAS ACTIVAS ────────────────────────────────────────
    console.log('\nCreando licencias...');

    const licenseData = [
      { slug: 'acceso-digital', planKey: 'acceso-digital-Anual', users: 8, domain: 'accesodigital.iados.mx', daysFromNow: 340 },
      { slug: 'pos', planKey: 'pos-Anual', users: 5, domain: 'pos.iados.mx', daysFromNow: 180 },
      { slug: 'fitcontrol', planKey: 'fitcontrol-Pro', users: 6, domain: 'fitcontrol.iados.online', daysFromNow: 25 },
      { slug: 'cfdi-check', planKey: 'cfdi-check-Anual Business', users: 3, domain: 'cfdicheck.iados.online', daysFromNow: 120 },
    ];

    for (const lic of licenseData) {
      const productId = productIds[lic.slug];
      const planId = planIds[lic.planKey];
      const versionId = versionIds[lic.slug];

      // Generate a readable license key
      const keyPrefix = lic.slug.toUpperCase().replace(/-/g, '').substring(0, 4);
      const licKey = `${keyPrefix}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}`.toUpperCase();

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + lic.daysFromNow);

      const licRes = await client.query(
        `INSERT INTO licenses (
           license_key, client_id, product_id, plan_id, version_id,
           status, max_users, current_users, start_date, end_date,
           activation_date, auto_renew, domain, created_by, notes
         ) VALUES ($1,$2,$3,$4,$5,'activa',$6,$7,NOW(),$8,NOW(),true,$9,$10,
           'Licencia de prueba generada por seed'
         ) RETURNING id, license_key`,
        [licKey, testClientId, productId, planId, versionId,
         lic.users, Math.floor(lic.users * 0.6), endDate.toISOString().split('T')[0],
         lic.domain, adminId]
      );

      const { id: licId, license_key: licKeyResult } = licRes.rows[0];
      console.log(`✅ Licencia ${lic.slug}: ${licKeyResult} — ${lic.daysFromNow} días restantes`);

      // Log version history
      await client.query(
        `INSERT INTO client_version_history (client_id, version_id, product_id, assigned_by, notes)
         VALUES ($1,$2,$3,$4,'Versión inicial asignada en seed')`,
        [testClientId, versionId, productId, adminId]
      );

      // Activity log
      await client.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
         VALUES ($1,'create','license',$2)`,
        [adminId, licId]
      );
    }

    // ─── 4. PAGOS DE PRUEBA ──────────────────────────────────────────
    console.log('\nCreando pagos de ejemplo...');

    const products_arr = [
      { slug: 'acceso-digital', amount: 8500, month: -2 },
      { slug: 'pos', amount: 10500, month: -1 },
      { slug: 'fitcontrol', amount: 1299, month: 0 },
      { slug: 'cfdi-check', amount: 8500, month: -3 },
    ];

    for (const p of products_arr) {
      const paidAt = new Date();
      paidAt.setMonth(paidAt.getMonth() + p.month);

      await client.query(
        `INSERT INTO payments (client_id, amount, currency, exchange_rate, amount_mxn, status, method, reference, paid_at, notes)
         VALUES ($1,$2,'MXN',1,$2,'completado','transferencia',
           'TRF-' || upper(substr(md5(random()::text),1,8)),
           $3,'Pago de prueba - seed')`,
        [testClientId, p.amount, paidAt.toISOString()]
      );
    }
    console.log('✅ 4 pagos históricos de prueba creados');

    // ─── 5. NOTIFICACIÓN DE BIENVENIDA ───────────────────────────────
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read)
       SELECT id, 'sistema',
         '🎉 Sistemas de prueba cargados',
         'Se han cargado los 4 sistemas iados como productos con cliente y licencias de prueba. Revisa el dashboard.',
         false
       FROM users WHERE email='admin@iados.mx'`
    );

    await client.query('COMMIT');
    console.log('\n══════════════════════════════════════════');
    console.log('✅ Seed completo. Sistemas disponibles:');
    console.log('   • Acceso Digital → accesodigital.iados.mx');
    console.log('   • POS iados      → pos.iados.mx');
    console.log('   • FitControl     → fitcontrol.iados.online');
    console.log('   • CFDI Check     → cfdicheck.iados.online');
    console.log('══════════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function randomHex(bytes: number): string {
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

seed().catch(() => process.exit(1));
