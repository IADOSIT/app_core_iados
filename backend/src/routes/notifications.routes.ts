import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, getNotificationSettings, updateNotificationSettings } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

export default router;
