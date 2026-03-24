import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.base_price_mxn, p.base_price_usd,
              p.is_active, p.api_slug, p.system_url, p.api_secret, p.created_at, p.updated_at,
              COALESCE(json_agg(pp ORDER BY pp.created_at) FILTER (WHERE pp.id IS NOT NULL), '[]') as plans
       FROM products p
       LEFT JOIN product_plans pp ON pp.product_id = p.id AND pp.is_active = true
       WHERE p.is_active = true
       GROUP BY p.id ORDER BY p.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, basePriceMxn, basePriceUsd, apiSlug, systemUrl } = req.body;

    const result = await query(
      `INSERT INTO products (name, description, base_price_mxn, base_price_usd, api_slug, system_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, description, basePriceMxn || 0, basePriceUsd || 0, apiSlug || null, systemUrl || null]
    );

    const product = result.rows[0];
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, basePriceMxn, basePriceUsd, apiSlug, systemUrl } = req.body;

    const result = await query(
      `UPDATE products
       SET name=$1, description=$2, base_price_mxn=$3, base_price_usd=$4,
           api_slug=$5, system_url=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, description, basePriceMxn, basePriceUsd, apiSlug || null, systemUrl || null, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
};

export const addPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, priceMxn, priceUsd, maxUsers, durationDays, features } = req.body;

    const result = await query(
      `INSERT INTO product_plans (product_id, name, type, price_mxn, price_usd, max_users, duration_days, features)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, name, type, priceMxn || 0, priceUsd || 0, maxUsers, durationDays, JSON.stringify(features || [])]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al agregar plan' });
  }
};

// Regenerar API secret del producto
export const regenerateApiSecret = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE products
       SET api_secret = encode(gen_random_bytes(32), 'hex'), updated_at = NOW()
       WHERE id = $1 RETURNING api_secret`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }
    res.json({ success: true, apiSecret: result.rows[0].api_secret, message: 'API Secret regenerado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al regenerar secret' });
  }
};
