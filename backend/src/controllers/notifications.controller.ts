import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unreadOnly, limit = 50 } = req.query;
    const where = unreadOnly === 'true' ? 'AND n.is_read = false' : '';

    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${where}
       ORDER BY created_at DESC LIMIT $2`,
      [req.user?.userId, Number(limit)]
    );

    const countRes = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user?.userId]
    );

    res.json({
      success: true,
      data: result.rows,
      unreadCount: parseInt(countRes.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, req.user?.userId]
    );
    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar notificación' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user?.userId]);
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar notificaciones' });
  }
};

export const getNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [req.user?.userId]
    );

    if (result.rowCount === 0) {
      // Crear settings por defecto
      const user = await query('SELECT email FROM users WHERE id = $1', [req.user?.userId]);
      const created = await query(
        `INSERT INTO notification_settings (user_id, email_address) VALUES ($1,$2) RETURNING *`,
        [req.user?.userId, user.rows[0]?.email]
      );
      res.json({ success: true, data: created.rows[0] });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener configuración' });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      emailEnabled, emailAddress, whatsappEnabled, whatsappNumber,
      licenseExpiryDays, paymentDueDays,
    } = req.body;

    const result = await query(
      `INSERT INTO notification_settings
        (user_id, email_enabled, email_address, whatsapp_enabled, whatsapp_number, license_expiry_days, payment_due_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
        email_enabled=$2, email_address=$3, whatsapp_enabled=$4, whatsapp_number=$5,
        license_expiry_days=$6, payment_due_days=$7, updated_at=NOW()
       RETURNING *`,
      [req.user?.userId, emailEnabled, emailAddress, whatsappEnabled, whatsappNumber,
       licenseExpiryDays || [30, 7, 1], paymentDueDays || [7, 1]]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
  }
};
