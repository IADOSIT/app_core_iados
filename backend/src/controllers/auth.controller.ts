import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const result = await query(
      `SELECT u.*, r.name as role_name FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );
    if (result.rowCount === 0) {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      return;
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      return;
    }
    const payload = { userId: user.id, email: user.email, roleId: user.role_id, roleName: user.role_name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Guardar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)', [user.id, refreshToken, expiresAt]);
    // Actualizar last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleName: user.role_name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token requerido' });
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (stored.rowCount === 0) {
      res.status(401).json({ success: false, message: 'Refresh token inválido' });
      return;
    }
    const newAccessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      roleId: payload.roleId,
      roleName: payload.roleName,
    });
    res.json({ success: true, accessToken: newAccessToken });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token inválido o expirado' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  res.json({ success: true, message: 'Sesión cerrada' });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.last_login,
              r.name as role_name, r.display_name as role_display
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.user?.userId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};
