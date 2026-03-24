import { Router } from 'express';
import { getPayments, createPayment, updatePaymentStatus, getPaymentStats, deletePayment } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.post('/', createPayment);
router.patch('/:id/status', updatePaymentStatus);
router.delete('/:id', deletePayment);

export default router;
