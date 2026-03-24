import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateLicenseKey } from '../utils/licenseKey';

export const getLicenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, clientId, page = 1, limit = 20, expiringSoon } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`l.status = $${idx++}`); params.push(status); }
    if (clientId) { conditions.push(`l.client_id = $${idx++}`); params.push(clientId); }
    if (expiringSoon === 'true') {
      conditions.push(`l.end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'`);
      conditions.push(`l.status = 'activa'`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM licenses l ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const result = await query(
      `SELECT l.*,
              CASE WHEN l.end_date IS NULL THEN NULL
                   ELSE l.end_date - CURRENT_DATE END as days_remaining,
              c.company_name, c.first_name as client_first, c.last_name as client_last, c.email as client_email,
              p.name as product_name,
              pp.name as plan_name, pp.type as plan_type,
              sv.version, sv.version_name
       FROM licenses l
       LEFT JOIN clients c ON l.client_id = c.id
       LEFT JOIN products p ON l.product_id = p.id
       LEFT JOIN product_plans pp ON l.plan_id = pp.id
       LEFT JOIN software_versions sv ON l.version_id = sv.id
       ${where} ORDER BY l.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener licencias' });
  }
};

export const getLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT l.*,
              l.end_date - CURRENT_DATE as days_remaining,
              c.company_name, c.first_name as client_first, c.last_name as client_last,
              c.email as client_email, c.phone as client_phone,
              p.name as product_name,
              pp.name as plan_name, pp.type as plan_type, pp.price_mxn, pp.price_usd,
              sv.version, sv.version_name
       FROM licenses l
       LEFT JOIN clients c ON l.client_id = c.id
       LEFT JOIN products p ON l.product_id = p.id
       LEFT JOIN product_plans pp ON l.plan_id = pp.id
       LEFT JOIN software_versions sv ON l.version_id = sv.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Licencia no encontrada' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener licencia' });
  }
};

export const createLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, productId, planId, versionId, maxUsers, startDate, endDate, autoRenew, notes } = req.body;
    const licenseKey = generateLicenseKey();
    const planIdVal = planId && planId !== '' ? planId : null;
    const versionIdVal = versionId && versionId !== '' ? versionId : null;

    const result = await query(
      `INSERT INTO licenses (license_key, client_id, product_id, plan_id, version_id,
        max_users, start_date, end_date, auto_renew, notes, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendiente') RETURNING *`,
      [licenseKey, clientId, productId, planIdVal, versionIdVal, maxUsers || 1, startDate || null, endDate || null, autoRenew || false, notes, req.user?.userId]
    );

    // Registrar historial de versión si aplica
    if (versionIdVal) {
      await query(
        `INSERT INTO client_version_history (client_id, version_id, product_id, assigned_by)
         VALUES ($1,$2,$3,$4)`,
        [clientId, versionIdVal, productId, req.user?.userId]
      );
    }

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user?.userId, 'create', 'license', result.rows[0].id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear licencia' });
  }
};

export const updateLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, maxUsers, endDate, autoRenew, notes, versionId } = req.body;

    const result = await query(
      `UPDATE licenses SET status=$1, max_users=$2, end_date=$3, auto_renew=$4, notes=$5, version_id=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [status, maxUsers, endDate, autoRenew, notes, versionId, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Licencia no encontrada' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar licencia' });
  }
};

export const activateLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE licenses SET status='activa', activation_date=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Licencia no encontrada' });
      return;
    }
    res.json({ success: true, data: result.rows[0], message: 'Licencia activada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al activar licencia' });
  }
};

export const renewLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newEndDate } = req.body;

    const result = await query(
      `UPDATE licenses SET end_date=$1, status='activa', last_renewal_date=NOW(), updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [newEndDate, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Licencia no encontrada' });
      return;
    }
    res.json({ success: true, data: result.rows[0], message: 'Licencia renovada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al renovar licencia' });
  }
};

export const deleteLicense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM licenses WHERE id=$1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Licencia no encontrada' });
      return;
    }
    res.json({ success: true, message: 'Licencia eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar licencia' });
  }
};
