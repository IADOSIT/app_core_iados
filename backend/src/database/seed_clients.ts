/**
 * Seed: 4 clientes ficticios, uno por producto iados
 * Run: npx ts-node src/database/seed_clients.ts
 */
import { pool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

function rnd(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomHex(n: number) {
  let s = ''; const c = '0123456789abcdef';
  for (let i = 0; i < n * 2; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
function licKey(prefix: string) {
  return `${prefix}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}`.toUpperCase();
}

async function seed() {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const adminRes = await db.query("SELECT id FROM users WHERE email='admin@iados.mx' LIMIT 1");
    const adminId = adminRes.rows[0]?.id;

    // ─── Obtener productos y sus planes ───────────────────────────────
    const products = await db.query(
      `SELECT p.id, p.name, p.api_slug,
              (SELECT id FROM product_plans WHERE product_id=p.id AND name='Anual' LIMIT 1) as plan_anual,
              (SELECT id FROM product_plans WHERE product_id=p.id AND name='Pro' LIMIT 1) as plan_pro,
              (SELECT id FROM product_plans WHERE product_id=p.id AND name='Business' LIMIT 1) as plan_business,
              (SELECT id FROM product_plans WHERE product_id=p.id AND name='Mensual' LIMIT 1) as plan_mensual,
              (SELECT id FROM software_versions WHERE product_id=p.id AND is_latest=true LIMIT 1) as version_id
       FROM products p WHERE p.is_active=true`
    );

    const bySlug: Record<string, any> = {};
    for (const p of products.rows) bySlug[p.api_slug] = p;

    // ─── CLIENTES ─────────────────────────────────────────────────────
    const clients = [
      {
        // Cliente 1 → Acceso Digital
        product_slug: 'acceso-digital',
        plan_key: 'plan_anual',
        lic_prefix: 'ACCE',
        days: 210,
        current_users: 12,
        max_users: 20,
        client: {
          type: 'empresa', status: 'activo',
          company_name: 'Corporativo Nexus S.A. de C.V.',
          rfc: 'CNX180301HG5', industry: 'Manufactura',
          website: 'https://corporativonexus.com.mx',
          email: 'sistemas@corporativonexus.com.mx',
          phone: '+52 81 2233 4455', whatsapp: '+52 81 2233 4455',
          address: 'Av. Morones Prieto 4500, Col. San Pedro',
          city: 'Monterrey', state: 'Nuevo León', postal_code: '64010',
          profit_person_count: 3,
          notes: 'Empresa manufacturera con 3 plantas. Usan Acceso Digital para control de entradas/salidas de personal.',
        },
        contacts: [
          { first: 'Roberto', last: 'Garza Treviño', email: 'rgarza@corporativonexus.com.mx', phone: '+52 81 2233 4456', pos: 'Gerente de TI', primary: true },
          { first: 'Sandra', last: 'Villarreal Cruz', email: 'svillarreal@corporativonexus.com.mx', phone: '+52 81 2233 4457', pos: 'Recursos Humanos', primary: false },
        ],
        payments: [
          { amount: 8500, months_ago: 12 }, { amount: 8500, months_ago: 0 },
        ],
      },
      {
        // Cliente 2 → POS iados
        product_slug: 'pos',
        plan_key: 'plan_anual',
        lic_prefix: 'POSI',
        days: 155,
        current_users: 4,
        max_users: 10,
        client: {
          type: 'empresa', status: 'activo',
          company_name: 'Comercializadora El Roble S.A. de C.V.',
          rfc: 'CER200715AB3', industry: 'Comercio Minorista',
          website: 'https://elroble.mx',
          email: 'admin@elroble.mx',
          phone: '+52 33 3344 5566', whatsapp: '+52 33 3344 5566',
          address: 'Calzada del Ejército 892, Col. Echeverría',
          city: 'Guadalajara', state: 'Jalisco', postal_code: '44970',
          profit_person_count: 2,
          notes: 'Cadena de abarrotes con 4 sucursales. Migración de sistema legacy a POS iados realizada en Q1 2024.',
        },
        contacts: [
          { first: 'Jorge', last: 'Hernández Mora', email: 'jhernandez@elroble.mx', phone: '+52 33 3344 5567', pos: 'Dueño', primary: true },
          { first: 'Patricia', last: 'López Fuentes', email: 'plopez@elroble.mx', phone: '+52 33 3344 5568', pos: 'Contadora', primary: false },
        ],
        payments: [
          { amount: 10500, months_ago: 11 }, { amount: 10500, months_ago: -1 },
        ],
      },
      {
        // Cliente 3 → FitControl
        product_slug: 'fitcontrol',
        plan_key: 'plan_pro',
        lic_prefix: 'FITC',
        days: 18,
        current_users: 7,
        max_users: 10,
        client: {
          type: 'empresa', status: 'activo',
          company_name: 'Gimnasio PowerFit S.A. de C.V.',
          rfc: 'GPF190820KL9', industry: 'Deportes y Fitness',
          website: 'https://powerfit.mx',
          email: 'gerencia@powerfit.mx',
          phone: '+52 55 5566 7788', whatsapp: '+52 55 5566 7788',
          address: 'Insurgentes Sur 2374, Col. Pedregal de San Nicolás',
          city: 'Ciudad de México', state: 'CDMX', postal_code: '04700',
          profit_person_count: 2,
          notes: 'Cadena de 3 gimnasios en CDMX. Licencia próxima a vencer — gestión urgente de renovación.',
        },
        contacts: [
          { first: 'Alejandro', last: 'Soto Medina', email: 'asoto@powerfit.mx', phone: '+52 55 5566 7789', pos: 'Director General', primary: true },
          { first: 'Carmen', last: 'Torres Jiménez', email: 'ctorres@powerfit.mx', phone: '+52 55 5566 7790', pos: 'Coordinadora Administrativa', primary: false },
        ],
        payments: [
          { amount: 1299, months_ago: 11 }, { amount: 1299, months_ago: 10 },
          { amount: 1299, months_ago: 9 }, { amount: 1299, months_ago: 8 },
          { amount: 1299, months_ago: 7 }, { amount: 1299, months_ago: 6 },
          { amount: 1299, months_ago: 5 }, { amount: 1299, months_ago: 4 },
          { amount: 1299, months_ago: 3 }, { amount: 1299, months_ago: 2 },
          { amount: 1299, months_ago: 1 }, { amount: 1299, months_ago: 0, pending: true },
        ],
      },
      {
        // Cliente 4 → CFDI Check
        product_slug: 'cfdi-check',
        plan_key: 'plan_business',
        lic_prefix: 'CFDI',
        days: 95,
        current_users: 3,
        max_users: 5,
        client: {
          type: 'persona_fisica', status: 'activo',
          first_name: 'Miguel Ángel', last_name: 'Ramírez Ortiz',
          rfc: 'RAOM850412FG2', industry: 'Servicios Contables',
          website: null,
          email: 'mramirez.contador@gmail.com',
          phone: '+52 222 333 4455', whatsapp: '+52 222 333 4455',
          address: 'Calle 2 Norte 1204, Col. La Paz',
          city: 'Puebla', state: 'Puebla', postal_code: '72160',
          profit_person_count: 2,
          notes: 'Contador independiente con cartera de 40 clientes. Usa CFDI Check para validación masiva de facturas.',
        },
        contacts: [
          { first: 'Miguel Ángel', last: 'Ramírez Ortiz', email: 'mramirez.contador@gmail.com', phone: '+52 222 333 4455', pos: 'Titular', primary: true },
        ],
        payments: [
          { amount: 899, months_ago: 5 }, { amount: 899, months_ago: 4 },
          { amount: 899, months_ago: 3 }, { amount: 899, months_ago: 2 },
          { amount: 899, months_ago: 1 }, { amount: 899, months_ago: 0 },
        ],
      },
    ];

    for (const entry of clients) {
      const { type, status, company_name, rfc, industry, website,
              email, phone, whatsapp, address, city, state, postal_code,
              profit_person_count, notes,
              first_name, last_name } = entry.client as any;

      // Check if already exists
      const check = await db.query(
        'SELECT id FROM clients WHERE email=$1 LIMIT 1', [email]
      );
      if (check.rows[0]) {
        console.log(`⚠️  Ya existe: ${company_name || first_name} — saltando`);
        continue;
      }

      const cRes = await db.query(
        `INSERT INTO clients (
           type, status, company_name, rfc, industry, website,
           first_name, last_name, email, phone, whatsapp,
           address, city, state, country, postal_code,
           profit_person_count, assigned_to, notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'México',$15,$16,$17,$18)
         RETURNING id`,
        [type, status, company_name || null, rfc, industry, website,
         first_name || null, last_name || null, email, phone, whatsapp,
         address, city, state, postal_code,
         profit_person_count, adminId, notes]
      );
      const clientId = cRes.rows[0].id;
      console.log(`\n✅ Cliente: ${company_name || `${first_name} ${last_name}`} [${clientId}]`);

      // Contactos
      for (const ct of entry.contacts) {
        await db.query(
          `INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, position, is_primary)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [clientId, ct.first, ct.last, ct.email, ct.phone, ct.pos, ct.primary]
        );
      }
      console.log(`   👤 ${entry.contacts.length} contacto(s)`);

      // Licencia
      const prod = bySlug[entry.product_slug];
      if (!prod) { console.log(`   ⚠️ Producto no encontrado: ${entry.product_slug}`); continue; }

      const planId = prod[entry.plan_key];
      const versionId = prod.version_id;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + entry.days);
      const key = licKey(entry.lic_prefix);

      const licRes = await db.query(
        `INSERT INTO licenses (
           license_key, client_id, product_id, plan_id, version_id,
           status, max_users, current_users, start_date, end_date,
           activation_date, auto_renew, domain, created_by
         ) VALUES ($1,$2,$3,$4,$5,'activa',$6,$7,NOW(),$8,NOW(),true,$9,$10)
         RETURNING id, license_key`,
        [key, clientId, prod.id, planId, versionId,
         entry.max_users, entry.current_users,
         endDate.toISOString().split('T')[0],
         `${entry.product_slug}.iados.${entry.product_slug.includes('fit') || entry.product_slug.includes('cfdi') ? 'online' : 'mx'}`,
         adminId]
      );
      console.log(`   🔑 Licencia: ${licRes.rows[0].license_key} — ${entry.days} días`);

      // Historial de versión
      if (versionId) {
        await db.query(
          `INSERT INTO client_version_history (client_id, version_id, product_id, assigned_by)
           VALUES ($1,$2,$3,$4)`,
          [clientId, versionId, prod.id, adminId]
        );
      }

      // Pagos
      let paymentsCreated = 0;
      for (const pay of entry.payments) {
        const paidAt = new Date();
        paidAt.setMonth(paidAt.getMonth() - pay.months_ago);
        const payStatus = (pay as any).pending ? 'pendiente' : 'completado';
        const paidAtVal = payStatus === 'completado' ? paidAt.toISOString() : null;
        const dueDate = payStatus === 'pendiente'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null;

        await db.query(
          `INSERT INTO payments (client_id, amount, currency, exchange_rate, amount_mxn,
                                 status, method, reference, paid_at, due_date, notes)
           VALUES ($1,$2,'MXN',1,$2,$3,'transferencia',
             'TRF-' || upper(substr(md5(random()::text),1,8)),
             $4,$5,'Pago mensual de licencia')`,
          [clientId, pay.amount, payStatus, paidAtVal, dueDate]
        );
        paymentsCreated++;
      }
      console.log(`   💰 ${paymentsCreated} pago(s) registrado(s)`);

      // Activity log
      await db.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
         VALUES ($1,'create','client',$2)`,
        [adminId, clientId]
      );
    }

    await db.query('COMMIT');
    console.log('\n══════════════════════════════════════════');
    console.log('✅ Seed de clientes completo');
    console.log('══════════════════════════════════════════\n');
  } catch (e) {
    await db.query('ROLLBACK');
    console.error(e);
    throw e;
  } finally {
    db.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
