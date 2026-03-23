import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, page = 1, limit = 20, from, to, year, month } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (categoryId) { conditions.push(`e.category_id = $${idx++}`); params.push(categoryId); }
    if (from) { conditions.push(`e.date >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`e.date <= $${idx++}`); params.push(to); }
    if (year) { conditions.push(`EXTRACT(YEAR FROM e.date) = $${idx++}`); params.push(year); }
    if (month) { conditions.push(`EXTRACT(MONTH FROM e.date) = $${idx++}`); params.push(month); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM expenses e ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const result = await query(
      `SELECT e.*, ec.name as category_name, ec.color as category_color, ec.icon as category_icon,
              u.first_name as created_by_first
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       LEFT JOIN users u ON e.created_by = u.id
       ${where} ORDER BY e.date DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener gastos' });
  }
};

export const getExpenseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const [monthly, byCategory, summary] = await Promise.all([
      query(
        `SELECT TO_CHAR(date, 'Mon') as month, EXTRACT(MONTH FROM date) as month_num,
                SUM(amount_mxn) as total
         FROM expenses WHERE EXTRACT(YEAR FROM date) = $1
         GROUP BY month, month_num ORDER BY month_num`,
        [year]
      ),
      query(
        `SELECT ec.name, ec.color, SUM(e.amount_mxn) as total
         FROM expenses e
         LEFT JOIN expense_categories ec ON e.category_id = ec.id
         WHERE EXTRACT(YEAR FROM e.date) = $1
         GROUP BY ec.name, ec.color ORDER BY total DESC`,
        [year]
      ),
      query(
        `SELECT
           SUM(amount_mxn) as total_year,
           SUM(CASE WHEN EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
               AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
               THEN amount_mxn ELSE 0 END) as total_month
         FROM expenses WHERE EXTRACT(YEAR FROM date) = $1`,
        [year]
      ),
    ]);

    res.json({
      success: true,
      data: { monthly: monthly.rows, byCategory: byCategory.rows, summary: summary.rows[0] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, description, amount, currency, exchangeRate, date, vendor, notes } = req.body;
    const amountMxn = currency === 'USD' ? amount * (exchangeRate || 1) : amount;

    const result = await query(
      `INSERT INTO expenses (category_id, description, amount, currency, exchange_rate, amount_mxn, date, vendor, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [categoryId, description, amount, currency || 'MXN', exchangeRate || 1, amountMxn, date, vendor, notes, req.user?.userId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear gasto' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { categoryId, description, amount, currency, exchangeRate, date, vendor, notes } = req.body;
    const amountMxn = currency === 'USD' ? amount * (exchangeRate || 1) : amount;

    const result = await query(
      `UPDATE expenses SET category_id=$1, description=$2, amount=$3, currency=$4, exchange_rate=$5,
        amount_mxn=$6, date=$7, vendor=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [categoryId, description, amount, currency, exchangeRate || 1, amountMxn, date, vendor, notes, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar gasto' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true, message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar gasto' });
  }
};

export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM expense_categories WHERE is_active = true ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
};
