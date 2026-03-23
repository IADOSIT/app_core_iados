import { Router } from 'express';
import { getPayments, createPayment, updatePaymentStatus, getPaymentStats } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.post('/', createPayment);
router.patch('/:id/status', updatePaymentStatus);

export default router;
