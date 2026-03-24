import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { encrypt, decrypt } from '../utils/vault';

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (type) { conditions.push(`c.type = $${idx++}`); params.push(type); }
    if (search) {
      conditions.push(`(c.company_name ILIKE $${idx} OR c.first_name ILIKE $${idx} OR c.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM clients c ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(Number(limit), offset);
    const result = await query(
      `SELECT c.id, c.type, c.status, c.company_name, c.rfc, c.industry, c.website,
              c.first_name, c.last_name, c.email, c.phone, c.whatsapp,
              c.address, c.city, c.state, c.country, c.postal_code,
              c.profit_person_count, c.notes, c.created_at, c.updated_at,
              c.payment_cutoff_day, c.formal_start_date, c.demo_start_date, c.demo_end_date,
              c.admin_user, (c.admin_password_enc IS NOT NULL AND c.admin_password_enc != '') as has_admin_password,
              u.first_name as assigned_first, u.last_name as assigned_last,
              (SELECT COUNT(*) FROM licenses l WHERE l.client_id = c.id AND l.status = 'activa') as active_licenses,
              (SELECT COUNT(*) FROM payments p WHERE p.client_id = c.id AND p.status = 'pendiente') as pending_payments,
              (
                SELECT json_agg(json_build_object(
                  'productId', p.id, 'productName', p.name,
                  'systemUrl', p.system_url, 'status', l.status
                ))
                FROM licenses l
                JOIN products p ON l.product_id = p.id
                WHERE l.client_id = c.id AND l.status IN ('activa','pendiente')
              ) as active_products
       FROM clients c
       LEFT JOIN users u ON c.assigned_to = u.id
       ${where} ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener clientes' });
  }
};

export const getClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, u.first_name as assigned_first, u.last_name as assigned_last,
              (SELECT COUNT(*) FROM licenses l WHERE l.client_id = c.id AND l.status = 'activa') as active_licenses,
              (SELECT COUNT(*) FROM payments p WHERE p.client_id = c.id AND p.status = 'pendiente') as pending_payments
       FROM clients c LEFT JOIN users u ON c.assigned_to = u.id WHERE c.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }
    const client = result.rows[0];

    // Obtener contactos, licencias, pagos, historial versiones
    const [contacts, licenses, payments, versions] = await Promise.all([
      query(`SELECT id, client_id, first_name, last_name, email, phone, position, is_primary, created_at
             FROM client_contacts WHERE client_id = $1 ORDER BY is_primary DESC`, [id]),
      query(`SELECT l.id, l.license_key, l.status, l.max_users, l.current_users,
                    l.start_date, l.end_date, l.auto_renew, l.notes, l.created_at,
                    p.name as product_name, pp.name as plan_name, pp.type as plan_type,
                    sv.version, sv.version_name
             FROM licenses l
             LEFT JOIN products p ON l.product_id = p.id
             LEFT JOIN product_plans pp ON l.plan_id = pp.id
             LEFT JOIN software_versions sv ON l.version_id = sv.id
             WHERE l.client_id = $1 ORDER BY l.created_at DESC`, [id]),
      query(`SELECT pay.id, pay.amount, pay.currency, pay.exchange_rate, pay.amount_mxn,
                    pay.status, pay.method, pay.reference, pay.notes, pay.paid_at,
                    pay.due_date, pay.created_at, inv.invoice_number
             FROM payments pay
             LEFT JOIN invoices inv ON pay.invoice_id = inv.id
             WHERE pay.client_id = $1 ORDER BY pay.created_at DESC LIMIT 20`, [id]),
      query(`SELECT cvh.id, cvh.assigned_at, cvh.notes,
                    sv.version, sv.version_name, p.name as product_name,
                    u.first_name as assigned_by_first
             FROM client_version_history cvh
             LEFT JOIN software_versions sv ON cvh.version_id = sv.id
             LEFT JOIN products p ON cvh.product_id = p.id
             LEFT JOIN users u ON cvh.assigned_by = u.id
             WHERE cvh.client_id = $1 ORDER BY cvh.assigned_at DESC`, [id]),
    ]);

    res.json({
      success: true,
      data: {
        ...client,
        activeLicenses: Number(client.active_licenses) || 0,
        pendingPayments: Number(client.pending_payments) || 0,
        contacts: contacts.rows.map((c: any) => ({
          ...c,
          firstName: c.first_name,
          lastName: c.last_name,
          isPrimary: c.is_primary,
          createdAt: c.created_at,
        })),
        licenses: licenses.rows.map((l: any) => ({
          ...l,
          licenseKey: l.license_key,
          productName: l.product_name,
          planName: l.plan_name,
          planType: l.plan_type,
          maxUsers: l.max_users,
          currentUsers: l.current_users ?? 0,
          startDate: l.start_date,
          endDate: l.end_date,
          autoRenew: l.auto_renew,
          versionName: l.version_name,
          createdAt: l.created_at,
        })),
        payments: payments.rows.map((p: any) => ({
          ...p,
          exchangeRate: p.exchange_rate,
          amountMxn: p.amount_mxn,
          paidAt: p.paid_at,
          dueDate: p.due_date,
          invoiceNumber: p.invoice_number,
          createdAt: p.created_at,
        })),
        versionHistory: versions.rows.map((v: any) => ({
          ...v,
          productName: v.product_name,
          versionName: v.version_name,
          assignedByFirst: v.assigned_by_first,
          assignedAt: v.assigned_at,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cliente' });
  }
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type, status, companyName, rfc, industry, website,
      firstName, lastName, email, phone, whatsapp,
      address, city, state, country, postalCode,
      profitPersonCount, assignedTo, notes,
      adminUser, adminPassword,
      paymentCutoffDay, formalStartDate, demoStartDate, demoEndDate,
    } = req.body;
    const encPwd = adminPassword ? encrypt(adminPassword) : null;

    const result = await query(
      `INSERT INTO clients (type, status, company_name, rfc, industry, website,
        first_name, last_name, email, phone, whatsapp, address, city, state, country, postal_code,
        profit_person_count, assigned_to, notes, admin_user, admin_password_enc,
        payment_cutoff_day, formal_start_date, demo_start_date, demo_end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [type, status || 'prospecto', companyName, rfc, industry, website,
       firstName, lastName, email, phone, whatsapp,
       address, city, state, country || 'México', postalCode,
       profitPersonCount || 2, assignedTo || req.user?.userId, notes,
       adminUser || null, encPwd,
       paymentCutoffDay || null, formalStartDate || null, demoStartDate || null, demoEndDate || null]
    );

    // Log actividad
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user?.userId, 'create', 'client', result.rows[0].id, JSON.stringify({ name: companyName || `${firstName} ${lastName}` })]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear cliente' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type, status, companyName, rfc, industry, website,
      firstName, lastName, email, phone, whatsapp,
      address, city, state, country, postalCode,
      profitPersonCount, assignedTo, notes,
      adminUser, adminPassword,
      paymentCutoffDay, formalStartDate, demoStartDate, demoEndDate,
    } = req.body;
    const encPwd = adminPassword && adminPassword !== '••••••••' ? encrypt(adminPassword) : undefined;

    const result = await query(
      `UPDATE clients SET
        type=$1, status=$2, company_name=$3, rfc=$4, industry=$5, website=$6,
        first_name=$7, last_name=$8, email=$9, phone=$10, whatsapp=$11,
        address=$12, city=$13, state=$14, country=$15, postal_code=$16,
        profit_person_count=$17, assigned_to=$18, notes=$19,
        admin_user=$20,
        admin_password_enc = COALESCE($21, admin_password_enc),
        payment_cutoff_day=$22, formal_start_date=$23, demo_start_date=$24, demo_end_date=$25,
        updated_at=NOW()
       WHERE id=$26 RETURNING *`,
      [type, status, companyName, rfc, industry, website,
       firstName, lastName, email, phone, whatsapp,
       address, city, state, country, postalCode,
       profitPersonCount, assignedTo, notes,
       adminUser || null, encPwd || null,
       paymentCutoffDay || null, formalStartDate || null, demoStartDate || null, demoEndDate || null,
       id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Cascade-delete related records first
    await query('DELETE FROM client_version_history WHERE client_id = $1', [id]);
    await query('DELETE FROM client_contacts WHERE client_id = $1', [id]);
    await query('DELETE FROM licenses WHERE client_id = $1', [id]);
    await query('DELETE FROM payments WHERE client_id = $1', [id]);
    await query('DELETE FROM invoices WHERE client_id = $1', [id]);
    await query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ success: true, message: 'Cliente eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar cliente' });
  }
};

export const revealClientPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT admin_password_enc FROM clients WHERE id=$1`, [id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Cliente no encontrado' }); return; }
    const plain = decrypt(result.rows[0].admin_password_enc || '');
    res.json({ success: true, password: plain });
  } catch {
    res.status(500).json({ success: false, message: 'Error al obtener contraseña' });
  }
};

export const addContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, position, isPrimary } = req.body;

    if (isPrimary) {
      await query('UPDATE client_contacts SET is_primary = false WHERE client_id = $1', [id]);
    }

    const result = await query(
      `INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, position, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, firstName, lastName, email, phone, position, isPrimary || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al agregar contacto' });
  }
};
