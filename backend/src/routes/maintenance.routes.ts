import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
const requireAdmin = requireRole('admin');
import {
  getBackupSettings,
  updateBackupSettings,
  testConnection,
  runManualBackup,
  deleteDemoData,
  getSystemStats,
} from '../controllers/maintenance.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getSystemStats);
router.get('/backup-config', getBackupSettings);
router.put('/backup-config', updateBackupSettings);
router.post('/backup-config/test', testConnection);
router.post('/backup', runManualBackup);
router.delete('/demo-data', deleteDemoData);

export default router;
