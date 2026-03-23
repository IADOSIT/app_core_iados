import { Router } from 'express';
import { getUsers, createUser, updateUser, changePassword, getRoles } from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/roles', getRoles);
router.get('/', requireRole('admin'), getUsers);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', requireRole('admin'), updateUser);
router.post('/change-password', changePassword);

export default router;
