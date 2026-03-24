/**
 * Public API — Sin autenticación JWT.
 * Usado por los sistemas externos (accesodigital, pos, fitcontrol, cfdicheck)
 * para validar licencias en tiempo real.
 *
 * Seguridad: cada producto tiene un `api_secret` único.
 * El sistema externo envía: Header `X-API-Key: {product.api_secret}`
 * Sin X-API-Key: respuesta mínima (válido/inválido, días restantes).
 * Con X-API-Key correcto: respuesta completa.
 */
import { Request, Response } from 'express';
import { query } from '../config/database';

// ──────────────────────────────────────────────────
// GET /public/licenses/validate/:key
// ──────────────────────────────────────────────────
export const validateLicense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!key) {
      res.status(400).json({ valid: false, error: 'License key requerida' });
      return;
    }

    // Fetch license + product api_secret
    const result = await query(
      `SELECT
         l.id, l.license_key, l.status, l.max_users, l.current_users,
         l.start_date, l.end_date, l.auto_renew, l.domain,
         (l.end_date - CURRENT_DATE) AS days_remaining,
         p.name AS product_name, p.api_slug, p.api_secret, p.system_url,
         pp.name AS plan_name, pp.type AS plan_type,
         sv.version, sv.version_name,
         c.company_name, c.first_name AS client_first, c.last_name AS client_last
       FROM licenses l
       JOIN products p ON l.product_id = p.id
       LEFT JOIN product_plans pp ON l.plan_id = pp.id
       LEFT JOIN software_versions sv ON l.version_id = sv.id
       LEFT JOIN clients c ON l.client_id = c.id
       WHERE l.license_key = $1`,
      [key]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ valid: false, error: 'Licencia no encontrada' });
      return;
    }

    const lic = result.rows[0];

    // Determine validity
    const isExpired = lic.end_date && lic.days_remaining !== null && lic.days_remaining < 0;
    const isActive = lic.status === 'activa' && !isExpired;
    const daysRemaining = lic.days_remaining !== null ? Number(lic.days_remaining) : null;

    // Base (public) response — no secrets exposed
    const baseResponse = {
      valid: isActive,
      status: lic.status as string,
      daysRemaining,
      maxUsers: lic.max_users as number,
      currentUsers: lic.current_users as number,
      endDate: lic.end_date ? String(lic.end_date).substring(0, 10) : null,
      autoRenew: lic.auto_renew as boolean,
      product: lic.product_name as string,
      plan: lic.plan_name as string | null,
      version: lic.version as string | null,
    };

    // Authenticated response — full details
    const authenticated = apiKey && apiKey === lic.api_secret;

    if (!authenticated) {
      res.json({ ...baseResponse, _auth: 'provide X-API-Key for full details' });
      return;
    }

    res.json({
      ...baseResponse,
      licenseKey: lic.license_key as string,
      client: lic.company_name || `${lic.client_first} ${lic.client_last}`,
      versionName: lic.version_name as string | null,
      planType: lic.plan_type as string | null,
      domain: lic.domain as string | null,
      systemUrl: lic.system_url as string | null,
    });

  } catch (error) {
    console.error('validateLicense error:', error);
    res.status(500).json({ valid: false, error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────────────
// POST /public/licenses/heartbeat
// Body: { key, currentUsers, domain }
// Headers: X-API-Key: {api_secret}
// Actualiza current_users y last_heartbeat.
// ──────────────────────────────────────────────────
export const licenseHeartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, currentUsers, domain } = req.body as {
      key: string;
      currentUsers?: number;
      domain?: string;
    };
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!key || !apiKey) {
      res.status(400).json({ success: false, error: 'key y X-API-Key son requeridos' });
      return;
    }

    // Verify key + api_secret match
    const check = await query(
      `SELECT l.id, l.status, l.max_users, l.end_date,
              (l.end_date - CURRENT_DATE) AS days_remaining,
              p.api_secret
       FROM licenses l
       JOIN products p ON l.product_id = p.id
       WHERE l.license_key = $1`,
      [key]
    );

    if (check.rowCount === 0 || check.rows[0].api_secret !== apiKey) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return;
    }

    const lic = check.rows[0];
    const isActive = lic.status === 'activa' &&
      (lic.days_remaining === null || Number(lic.days_remaining) >= 0);

    if (!isActive) {
      res.json({ success: false, valid: false, error: `Licencia ${lic.status}` });
      return;
    }

    // Update heartbeat
    const updateParts: string[] = ['last_heartbeat = NOW()'];
    const params: unknown[] = [];
    let idx = 1;

    if (typeof currentUsers === 'number') {
      updateParts.push(`current_users = $${idx++}`);
      params.push(currentUsers);
    }
    if (domain) {
      updateParts.push(`domain = $${idx++}`);
      params.push(domain);
    }
    params.push(lic.id);

    await query(
      `UPDATE licenses SET ${updateParts.join(', ')} WHERE id = $${idx}`,
      params
    );

    // Warn if over user limit
    const overLimit = typeof currentUsers === 'number' && currentUsers > lic.max_users;

    res.json({
      success: true,
      valid: true,
      overLimit,
      maxUsers: lic.max_users as number,
      currentUsers: currentUsers ?? lic.current_users,
      daysRemaining: lic.days_remaining !== null ? Number(lic.days_remaining) : null,
    });

  } catch (error) {
    console.error('licenseHeartbeat error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────────────
// GET /public/products
// Lista pública de productos/sistemas (sin precios ni datos sensibles)
// ──────────────────────────────────────────────────
export const getPublicProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.api_slug, p.system_url,
              COUNT(l.id) FILTER (WHERE l.status='activa') AS active_licenses
       FROM products p
       LEFT JOIN licenses l ON l.product_id = p.id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.name`,
      []
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
};
