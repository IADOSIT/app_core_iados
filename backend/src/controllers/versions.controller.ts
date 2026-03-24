import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    const params: unknown[] = [];
    const where = productId ? `WHERE sv.product_id = $1` : '';
    if (productId) params.push(productId);

    const result = await query(
      `SELECT sv.*, p.name as product_name,
              (SELECT COUNT(*) FROM licenses l WHERE l.version_id = sv.id AND l.status = 'activa') as license_count,
              (SELECT COUNT(DISTINCT cvh.client_id) FROM client_version_history cvh WHERE cvh.version_id = sv.id) as client_count
       FROM software_versions sv
       LEFT JOIN products p ON sv.product_id = p.id
       ${where} ORDER BY sv.created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener versiones' });
  }
};

export const createVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, version, versionName, releaseNotes, isStable, isLatest, releasedAt } = req.body;

    // Si es latest, quitar el flag de las demás
    if (isLatest) {
      await query('UPDATE software_versions SET is_latest = false WHERE product_id = $1', [productId]);
    }

    const result = await query(
      `INSERT INTO software_versions (product_id, version, version_name, release_notes, is_stable, is_latest, released_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [productId, version, versionName, releaseNotes, isStable !== false, isLatest || false, releasedAt || new Date()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear versión' });
  }
};

export const updateVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { versionName, releaseNotes, isStable, isLatest } = req.body;

    const current = await query('SELECT product_id FROM software_versions WHERE id = $1', [id]);
    if (current.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Versión no encontrada' });
      return;
    }

    if (isLatest) {
      await query('UPDATE software_versions SET is_latest = false WHERE product_id = $1', [current.rows[0].product_id]);
    }

    const result = await query(
      `UPDATE software_versions SET version_name=$1, release_notes=$2, is_stable=$3, is_latest=$4
       WHERE id=$5 RETURNING *`,
      [versionName, releaseNotes, isStable, isLatest, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar versión' });
  }
};

export const deleteVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM software_versions WHERE id=$1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Versión no encontrada' });
      return;
    }
    res.json({ success: true, message: 'Versión eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar versión' });
  }
};

export const assignVersionToClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, versionId, productId, notes } = req.body;

    const result = await query(
      `INSERT INTO client_version_history (client_id, version_id, product_id, assigned_by, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [clientId, versionId, productId, req.user?.userId, notes]
    );

    // Actualizar versión en licencia activa si existe
    await query(
      `UPDATE licenses SET version_id = $1, updated_at = NOW()
       WHERE client_id = $2 AND product_id = $3 AND status = 'activa'`,
      [versionId, clientId, productId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al asignar versión' });
  }
};
