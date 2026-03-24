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
      `SELECT c.*, u.first_name as assigned_first, u.last_name as assigned_last
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
      query('SELECT * FROM client_contacts WHERE client_id = $1 ORDER BY is_primary DESC', [id]),
      query(`SELECT l.*, p.name as product_name, pp.name as plan_name, pp.type as plan_type
             FROM licenses l
             LEFT JOIN products p ON l.product_id = p.id
             LEFT JOIN product_plans pp ON l.plan_id = pp.id
             WHERE l.client_id = $1 ORDER BY l.created_at DESC`, [id]),
      query(`SELECT pay.*, inv.invoice_number FROM payments pay
             LEFT JOIN invoices inv ON pay.invoice_id = inv.id
             WHERE pay.client_id = $1 ORDER BY pay.created_at DESC LIMIT 10`, [id]),
      query(`SELECT cvh.*, sv.version, sv.version_name, p.name as product_name,
                    u.first_name as assigned_by_first
             FROM client_version_history cvh
             LEFT JOIN software_versions sv ON cvh.version_id = sv.id
             LEFT JOIN products p ON cvh.product_id = p.id
             LEFT JOIN users u ON cvh.assigned_by = u.id
             WHERE cvh.client_id = $1 ORDER BY cvh.assigned_at DESC`, [id]),
    ]);

    res.json({
      success: true,
      data: { ...client, contacts: contacts.rows, licenses: licenses.rows, payments: payments.rows, versionHistory: versions.rows },
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
    } = req.body;
    const encPwd = adminPassword ? encrypt(adminPassword) : null;

    const result = await query(
      `INSERT INTO clients (type, status, company_name, rfc, industry, website,
        first_name, last_name, email, phone, whatsapp, address, city, state, country, postal_code,
        profit_person_count, assigned_to, notes, admin_user, admin_password_enc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [type, status || 'prospecto', companyName, rfc, industry, website,
       firstName, lastName, email, phone, whatsapp,
       address, city, state, country || 'México', postalCode,
       profitPersonCount || 2, assignedTo || req.user?.userId, notes,
       adminUser || null, encPwd]
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
        updated_at=NOW()
       WHERE id=$22 RETURNING *`,
      [type, status, companyName, rfc, industry, website,
       firstName, lastName, email, phone, whatsapp,
       address, city, state, country, postalCode,
       profitPersonCount, assignedTo, notes,
       adminUser || null, encPwd || null, id]
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
    await query('UPDATE clients SET status = $1, updated_at = NOW() WHERE id = $2', ['inactivo', id]);
    res.json({ success: true, message: 'Cliente desactivado correctamente' });
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
