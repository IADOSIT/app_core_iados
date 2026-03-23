import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
              u.avatar_url, u.last_login, u.created_at,
              r.name as role_name, r.display_name as role_display
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, roleId } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, first_name, last_name, role_id, created_at`,
      [email, hash, firstName, lastName, phone, roleId || 2]
    );

    // Crear configuración de notificaciones por defecto
    await query(
      'INSERT INTO notification_settings (user_id, email_address) VALUES ($1,$2)',
      [result.rows[0].id, email]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      res.status(409).json({ success: false, message: 'El email ya está registrado' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, roleId, isActive } = req.body;

    const result = await query(
      `UPDATE users SET first_name=$1, last_name=$2, phone=$3, role_id=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, email, first_name, last_name, is_active`,
      [firstName, lastName, phone, roleId, isActive, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!valid) {
      res.status(400).json({ success: false, message: 'Contraseña actual incorrecta' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [newHash, userId]);

    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cambiar contraseña' });
  }
};

export const getRoles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM roles ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener roles' });
  }
};
