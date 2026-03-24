import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, clientId, page = 1, limit = 20, from, to } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (clientId) { conditions.push(`p.client_id = $${idx++}`); params.push(clientId); }
    if (from) { conditions.push(`p.created_at >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`p.created_at <= $${idx++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM payments p ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const result = await query(
      `SELECT p.*,
              c.company_name, c.first_name as client_first, c.last_name as client_last,
              i.invoice_number,
              l.license_key
       FROM payments p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN licenses l ON p.license_id = l.id
       ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pagos' });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      clientId, licenseId, invoiceId, amount, currency, exchangeRate,
      status, method, reference, notes, paidAt, dueDate,
    } = req.body;

    const amountMxn = currency === 'USD' ? amount * (exchangeRate || 1) : amount;

    const result = await query(
      `INSERT INTO payments (client_id, license_id, invoice_id, amount, currency, exchange_rate, amount_mxn,
        status, method, reference, notes, paid_at, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [clientId, licenseId, invoiceId, amount, currency || 'MXN', exchangeRate || 1, amountMxn,
       status || 'pendiente', method, reference, notes, paidAt, dueDate, req.user?.userId]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user?.userId, 'create', 'payment', result.rows[0].id, JSON.stringify({ amount, currency })]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar pago' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paidAt, reference } = req.body;

    const result = await query(
      `UPDATE payments SET status=$1, paid_at=$2, reference=COALESCE($3, reference), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, status === 'completado' ? (paidAt || new Date()) : (paidAt || null), reference, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Pago no encontrado' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar pago' });
  }
};

export const getPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const [monthly, byMethod, byStatus] = await Promise.all([
      query(
        `SELECT TO_CHAR(paid_at, 'Mon') as month, EXTRACT(MONTH FROM paid_at) as month_num,
                SUM(amount_mxn) as total, COUNT(*) as count
         FROM payments WHERE status = 'completado' AND EXTRACT(YEAR FROM paid_at) = $1
         GROUP BY month, month_num ORDER BY month_num`,
        [year]
      ),
      query(
        `SELECT method, SUM(amount_mxn) as total, COUNT(*) as count
         FROM payments WHERE status = 'completado'
         GROUP BY method ORDER BY total DESC`
      ),
      query(
        `SELECT status, COUNT(*) as count, SUM(amount_mxn) as total
         FROM payments GROUP BY status`
      ),
    ]);

    res.json({
      success: true,
      data: { monthly: monthly.rows, byMethod: byMethod.rows, byStatus: byStatus.rows },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

export const getProjection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();

    // Team size from system_settings (default 3)
    const settingRes = await query(`SELECT value FROM system_settings WHERE key = 'team_size'`);
    const teamSize = settingRes.rows.length ? Number(settingRes.rows[0].value) : 3;

    // Monthly licenses active + plan price
    const licensesRes = await query(`
      SELECT l.id as license_id, l.client_id,
             COALESCE(c.company_name, c.first_name || ' ' || c.last_name) as client_name,
             p.name as product_name, pp.name as plan_name,
             COALESCE(pp.price_mxn, 0) as price_mxn,
             c.payment_cutoff_day,
             (SELECT COALESCE(SUM(pay.amount_mxn), 0)
              FROM payments pay
              WHERE pay.license_id = l.id
                AND pay.status = 'completado'
                AND EXTRACT(MONTH FROM pay.paid_at) = $1
                AND EXTRACT(YEAR FROM pay.paid_at) = $2
             ) as paid_this_month,
             (SELECT COALESCE(SUM(pay.amount_mxn), 0)
              FROM payments pay
              WHERE pay.license_id = l.id
                AND pay.status = 'pendiente'
                AND EXTRACT(MONTH FROM COALESCE(pay.due_date, pay.created_at)) = $1
                AND EXTRACT(YEAR FROM COALESCE(pay.due_date, pay.created_at)) = $2
             ) as pending_this_month
      FROM licenses l
      JOIN clients c ON l.client_id = c.id
      JOIN products p ON l.product_id = p.id
      JOIN product_plans pp ON l.plan_id = pp.id
      WHERE l.status = 'activa' AND pp.type = 'mensual'
      ORDER BY c.payment_cutoff_day ASC NULLS LAST, client_name ASC
    `, [month, year]);

    // Payments already received this month
    const receivedRes = await query(`
      SELECT COALESCE(SUM(amount_mxn), 0) as total, COUNT(*) as count
      FROM payments
      WHERE status = 'completado'
        AND EXTRACT(MONTH FROM paid_at) = $1
        AND EXTRACT(YEAR FROM paid_at) = $2
    `, [month, year]);

    // Expenses this month
    const expensesRes = await query(`
      SELECT COALESCE(SUM(amount_mxn), 0) as total
      FROM expenses
      WHERE EXTRACT(MONTH FROM date) = $1
        AND EXTRACT(YEAR FROM date) = $2
    `, [month, year]);

    const licenses = licensesRes.rows.map((l: any) => ({
      licenseId: l.license_id,
      clientId: l.client_id,
      clientName: l.client_name,
      productName: l.product_name,
      planName: l.plan_name,
      priceMxn: Number(l.price_mxn),
      cutoffDay: l.payment_cutoff_day,
      dueDate: l.payment_cutoff_day ? `${year}-${String(month).padStart(2, '0')}-${String(Math.min(l.payment_cutoff_day, lastDay)).padStart(2, '0')}` : null,
      paidThisMonth: Number(l.paid_this_month),
      pendingThisMonth: Number(l.pending_this_month),
      status: Number(l.paid_this_month) > 0 ? 'pagado' : (Number(l.pending_this_month) > 0 ? 'pendiente' : 'sin_registro'),
    }));

    const projectedIncome = licenses.reduce((s: number, l: any) => s + l.priceMxn, 0);
    const receivedThisMonth = Number(receivedRes.rows[0].total);
    const expensesThisMonth = Number(expensesRes.rows[0].total);
    const netProjected = projectedIncome - expensesThisMonth;
    const perPerson = teamSize > 0 ? netProjected / teamSize : 0;
    const paidCount = licenses.filter((l: any) => l.status === 'pagado').length;
    const pendingCount = licenses.filter((l: any) => l.status !== 'pagado').length;

    res.json({
      success: true,
      data: {
        month, year, lastDay, teamSize,
        projectedIncome,
        receivedThisMonth,
        expensesThisMonth,
        netProjected,
        perPerson,
        paidCount,
        pendingCount,
        licenses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al calcular proyección: ${err.message}` });
  }
};

export const updateTeamSize = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamSize } = req.body;
    const size = Math.max(1, Math.min(20, Number(teamSize)));
    await query(
      `INSERT INTO system_settings (key, value) VALUES ('team_size', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [String(size)]
    );
    res.json({ success: true, teamSize: size });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM payments WHERE id=$1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Pago no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Pago eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar pago' });
  }
};
