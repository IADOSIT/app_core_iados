import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT p.*,
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
    const { name, description, basePriceMxn, basePriceUsd, plans } = req.body;

    const result = await query(
      `INSERT INTO products (name, description, base_price_mxn, base_price_usd)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, description, basePriceMxn || 0, basePriceUsd || 0]
    );

    const product = result.rows[0];

    if (plans && plans.length > 0) {
      for (const plan of plans) {
        await query(
          `INSERT INTO product_plans (product_id, name, type, price_mxn, price_usd, max_users, duration_days, features)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [product.id, plan.name, plan.type, plan.priceMxn || 0, plan.priceUsd || 0,
           plan.maxUsers, plan.durationDays, JSON.stringify(plan.features || [])]
        );
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, basePriceMxn, basePriceUsd } = req.body;

    const result = await query(
      `UPDATE products SET name=$1, description=$2, base_price_mxn=$3, base_price_usd=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name, description, basePriceMxn, basePriceUsd, id]
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
