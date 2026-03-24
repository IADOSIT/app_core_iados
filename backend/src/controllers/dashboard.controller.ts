import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      kpis, revenueMonthly, clientsByStatus, licensesByStatus,
      expiringSoon, pendingPayments, recentActivity, topClients,
      incomeVsExpenses, productStats,
    ] = await Promise.all([
      // KPIs principales
      query(`
        SELECT
          (SELECT COUNT(*) FROM clients WHERE status = 'activo') as active_clients,
          (SELECT COUNT(*) FROM licenses WHERE status = 'activa') as active_licenses,
          (SELECT COALESCE(SUM(amount_mxn),0) FROM payments WHERE status='completado'
           AND EXTRACT(MONTH FROM paid_at)=EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR FROM paid_at)=EXTRACT(YEAR FROM NOW())) as revenue_month,
          (SELECT COALESCE(SUM(amount_mxn),0) FROM payments WHERE status='completado'
           AND EXTRACT(YEAR FROM paid_at)=EXTRACT(YEAR FROM NOW())) as revenue_year,
          (SELECT COUNT(*) FROM payments WHERE status='pendiente') as pending_payments,
          (SELECT COUNT(*) FROM licenses WHERE end_date BETWEEN NOW() AND NOW()+INTERVAL '30 days' AND status='activa') as expiring_soon,
          (SELECT COALESCE(SUM(amount_mxn),0) FROM expenses
           WHERE EXTRACT(MONTH FROM date)=EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR FROM date)=EXTRACT(YEAR FROM NOW())) as expenses_month,
          (SELECT COUNT(*) FROM clients WHERE created_at >= NOW()-INTERVAL '30 days') as new_clients_month
      `),

      // Ingresos por mes (año actual)
      query(`
        SELECT TO_CHAR(paid_at,'Mon') as month, EXTRACT(MONTH FROM paid_at) as month_num,
               SUM(amount_mxn) as total
        FROM payments WHERE status='completado' AND EXTRACT(YEAR FROM paid_at)=EXTRACT(YEAR FROM NOW())
        GROUP BY month, month_num ORDER BY month_num
      `),

      // Clientes por status
      query(`SELECT status, COUNT(*) as count FROM clients GROUP BY status`),

      // Licencias por status
      query(`SELECT status, COUNT(*) as count FROM licenses GROUP BY status`),

      // Licencias por vencer (30 días)
      query(`
        SELECT l.*, c.company_name, c.first_name, c.last_name, c.email,
               p.name as product_name, l.end_date - CURRENT_DATE as days_remaining
        FROM licenses l
        LEFT JOIN clients c ON l.client_id = c.id
        LEFT JOIN products p ON l.product_id = p.id
        WHERE l.end_date BETWEEN NOW() AND NOW()+INTERVAL '30 days' AND l.status='activa'
        ORDER BY l.end_date ASC LIMIT 10
      `),

      // Pagos pendientes
      query(`
        SELECT p.*, c.company_name, c.first_name, c.last_name
        FROM payments p LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.status='pendiente' ORDER BY p.due_date ASC NULLS LAST LIMIT 10
      `),

      // Actividad reciente
      query(`
        SELECT al.*, u.first_name, u.last_name
        FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 15
      `),

      // Top clientes por pagos
      query(`
        SELECT c.id, COALESCE(c.company_name, c.first_name||' '||c.last_name) as name,
               SUM(p.amount_mxn) as total_paid, COUNT(p.id) as payment_count
        FROM clients c
        LEFT JOIN payments p ON p.client_id = c.id AND p.status = 'completado'
        GROUP BY c.id, name ORDER BY total_paid DESC NULLS LAST LIMIT 5
      `),

      // Ingresos vs Gastos por mes
      query(`
        SELECT months.month_num, months.month,
               COALESCE(inc.total, 0) as income,
               COALESCE(exp.total, 0) as expenses,
               COALESCE(inc.total, 0) - COALESCE(exp.total, 0) as profit
        FROM (
          SELECT generate_series(1,12) as month_num,
                 TO_CHAR(TO_DATE(generate_series(1,12)::text,'MM'),'Mon') as month
        ) months
        LEFT JOIN (
          SELECT EXTRACT(MONTH FROM paid_at)::int as m, SUM(amount_mxn) as total
          FROM payments WHERE status='completado' AND EXTRACT(YEAR FROM paid_at)=EXTRACT(YEAR FROM NOW())
          GROUP BY m
        ) inc ON inc.m = months.month_num
        LEFT JOIN (
          SELECT EXTRACT(MONTH FROM date)::int as m, SUM(amount_mxn) as total
          FROM expenses WHERE EXTRACT(YEAR FROM date)=EXTRACT(YEAR FROM NOW())
          GROUP BY m
        ) exp ON exp.m = months.month_num
        ORDER BY month_num
      `),

      // Productos: licencias activas + ingresos por producto
      query(`
        SELECT p.id, p.name, p.system_url,
               COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'activa') as active_licenses,
               COUNT(DISTINCT l.client_id) FILTER (WHERE l.status = 'activa') as active_clients,
               COALESCE(SUM(pay.amount_mxn) FILTER (WHERE pay.status='completado'
                 AND EXTRACT(YEAR FROM pay.paid_at)=EXTRACT(YEAR FROM NOW())), 0) as revenue_year,
               COALESCE(SUM(pay.amount_mxn) FILTER (WHERE pay.status='completado'
                 AND EXTRACT(MONTH FROM pay.paid_at)=EXTRACT(MONTH FROM NOW())
                 AND EXTRACT(YEAR FROM pay.paid_at)=EXTRACT(YEAR FROM NOW())), 0) as revenue_month
        FROM products p
        LEFT JOIN licenses l ON l.product_id = p.id
        LEFT JOIN payments pay ON pay.client_id = l.client_id
        GROUP BY p.id, p.name, p.system_url
        ORDER BY active_licenses DESC
      `),
    ]);

    res.json({
      success: true,
      data: {
        kpis: kpis.rows[0],
        revenueMonthly: revenueMonthly.rows,
        clientsByStatus: clientsByStatus.rows,
        licensesByStatus: licensesByStatus.rows,
        expiringSoon: expiringSoon.rows,
        pendingPayments: pendingPayments.rows,
        recentActivity: recentActivity.rows,
        topClients: topClients.rows,
        incomeVsExpenses: incomeVsExpenses.rows,
        productStats: productStats.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener dashboard' });
  }
};

export const getProfitReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const result = await query(`
      SELECT months.month_num, months.month,
             COALESCE(inc.total, 0) as income,
             COALESCE(exp.total, 0) as expenses,
             COALESCE(inc.total, 0) - COALESCE(exp.total, 0) as profit,
             CASE WHEN COALESCE(inc.total,0) > 0
                  THEN ROUND((COALESCE(inc.total,0)-COALESCE(exp.total,0))/COALESCE(inc.total,1)*100, 2)
                  ELSE 0 END as margin_pct
      FROM (
        SELECT generate_series(1,12) as month_num,
               TO_CHAR(TO_DATE(generate_series(1,12)::text,'MM'),'Mon') as month
      ) months
      LEFT JOIN (
        SELECT EXTRACT(MONTH FROM paid_at)::int as m, SUM(amount_mxn) as total
        FROM payments WHERE status='completado' AND EXTRACT(YEAR FROM paid_at)=$1
        GROUP BY m
      ) inc ON inc.m = months.month_num
      LEFT JOIN (
        SELECT EXTRACT(MONTH FROM date)::int as m, SUM(amount_mxn) as total
        FROM expenses WHERE EXTRACT(YEAR FROM date)=$1
        GROUP BY m
      ) exp ON exp.m = months.month_num
      ORDER BY month_num
    `, [year]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener reporte de ganancias' });
  }
};
