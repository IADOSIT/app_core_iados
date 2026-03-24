import { Router } from 'express';
import { getUsers, createUser, updateUser, changePassword, getRoles, toggleUserActive, resetUserPassword } from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/roles', getRoles);
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', requireRole('admin'), updateUser);
router.patch('/:id/toggle-active', requireRole('admin'), toggleUserActive);
router.post('/:id/reset-password', requireRole('admin'), resetUserPassword);
router.post('/change-password', changePassword);

export default router;
