import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { encrypt, decrypt } from '../utils/vault';

function buildProductSelect(sort = 'created_at', dir = 'asc') {
  const allowed: Record<string, string> = {
    created_at: 'p.created_at',
    name: 'p.name',
    base_price_mxn: 'p.base_price_mxn',
    base_price_usd: 'p.base_price_usd',
  };
  const orderCol = allowed[sort] || 'p.created_at';
  const orderDir = dir === 'desc' ? 'DESC' : 'ASC';
  return `
    SELECT p.id, p.name, p.description, p.base_price_mxn, p.base_price_usd,
           p.is_active, p.api_slug, p.system_url, p.api_secret,
           p.admin_user, p.admin_password_enc, p.access_url,
           p.created_at, p.updated_at,
           COALESCE(json_agg(pp ORDER BY pp.created_at) FILTER (WHERE pp.id IS NOT NULL), '[]') as plans
    FROM products p
    LEFT JOIN product_plans pp ON pp.product_id = p.id AND pp.is_active = true
    WHERE p.is_active = true
    GROUP BY p.id ORDER BY ${orderCol} ${orderDir}
  `;
}

function mapProduct(row: any) {
  return {
    ...row,
    adminUser: row.admin_user || '',
    hasAdminPassword: !!row.admin_password_enc,
    accessUrl: row.access_url || '',
    // Never return the encrypted password directly — use separate decrypt endpoint
    admin_password_enc: undefined,
  };
}

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sort, dir } = req.query as { sort?: string; dir?: string };
    const result = await query(buildProductSelect(sort, dir));
    res.json({ success: true, data: result.rows.map(mapProduct) });
  } catch {
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, basePriceMxn, basePriceUsd, apiSlug, systemUrl, adminUser, adminPassword, accessUrl, plans } = req.body;
    const encPwd = adminPassword ? encrypt(adminPassword) : null;

    const result = await query(
      `INSERT INTO products (name, description, base_price_mxn, base_price_usd, api_slug, system_url, admin_user, admin_password_enc, access_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, description, basePriceMxn || 0, basePriceUsd || 0, apiSlug || null, systemUrl || null, adminUser || null, encPwd, accessUrl || null]
    );
    const productId = result.rows[0].id;

    // Insert plans bundled with product creation
    if (Array.isArray(plans) && plans.length > 0) {
      for (const plan of plans) {
        await insertPlan(productId, plan);
      }
    }

    res.status(201).json({ success: true, data: mapProduct(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al crear producto: ${err.message}` });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, basePriceMxn, basePriceUsd, apiSlug, systemUrl, adminUser, adminPassword, accessUrl } = req.body;

    // Only re-encrypt if a new password was sent (not masked)
    let encPwd: string | undefined;
    if (adminPassword && adminPassword !== '••••••••') {
      encPwd = encrypt(adminPassword);
    }

    const result = await query(
      `UPDATE products
       SET name=$1, description=$2, base_price_mxn=$3, base_price_usd=$4,
           api_slug=$5, system_url=$6, admin_user=$7,
           admin_password_enc = COALESCE($8, admin_password_enc),
           access_url=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, description, basePriceMxn, basePriceUsd, apiSlug || null, systemUrl || null,
       adminUser || null, encPwd || null, accessUrl || null, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, data: mapProduct(result.rows[0]) });
  } catch {
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
};

// Reveal password (admin only, separate endpoint for audit control)
export const revealAdminPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT admin_password_enc FROM products WHERE id=$1`, [id]);
    if (!result.rows.length) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    const plain = decrypt(result.rows[0].admin_password_enc || '');
    res.json({ success: true, password: plain });
  } catch {
    res.status(500).json({ success: false, message: 'Error al obtener contraseña' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE products SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Producto desactivado' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
};

// ── Notes ────────────────────────────────────────────────────────────────────

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT pn.id, pn.note, pn.created_at,
              u.first_name || ' ' || u.last_name as author
       FROM product_notes pn
       LEFT JOIN users u ON pn.created_by = u.id
       WHERE pn.product_id = $1
       ORDER BY pn.created_at DESC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, message: 'Error al obtener notas' });
  }
};

export const addNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note?.trim()) {
      res.status(400).json({ success: false, message: 'Nota vacía' });
      return;
    }
    const result = await query(
      `INSERT INTO product_notes (product_id, note, created_by) VALUES ($1,$2,$3)
       RETURNING id, note, created_at`,
      [id, note.trim(), req.user?.userId || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: 'Error al agregar nota' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    await query(`DELETE FROM product_notes WHERE id=$1`, [noteId]);
    res.json({ success: true, message: 'Nota eliminada' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al eliminar nota' });
  }
};

// ── Plans / Secret (unchanged) ────────────────────────────────────────────────

async function insertPlan(productId: string, plan: any) {
  const { name, type, priceMxn, priceUsd, maxUsers, durationDays, features } = plan;
  const maxUsersVal = maxUsers !== '' && maxUsers != null ? Number(maxUsers) : null;
  const durationDaysVal = durationDays !== '' && durationDays != null ? Number(durationDays) : null;
  return query(
    `INSERT INTO product_plans (product_id, name, type, price_mxn, price_usd, max_users, duration_days, features)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [productId, name, type, priceMxn || 0, priceUsd || 0, maxUsersVal, durationDaysVal, JSON.stringify(features || [])]
  );
}

export const addPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await insertPlan(id, req.body);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al agregar plan: ${err.message}` });
  }
};

export const regenerateApiSecret = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE products SET api_secret = encode(gen_random_bytes(32), 'hex'), updated_at = NOW()
       WHERE id = $1 RETURNING api_secret`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, apiSecret: result.rows[0].api_secret, message: 'API Secret regenerado' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al regenerar secret' });
  }
};
