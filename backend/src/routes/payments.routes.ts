import { Router } from 'express';
import { getPayments, createPayment, updatePaymentStatus, getPaymentStats, deletePayment, getProjection, updateTeamSize } from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.get('/projection', getProjection);
router.post('/team-size', updateTeamSize);
router.post('/', createPayment);
router.patch('/:id/status', updatePaymentStatus);
router.delete('/:id', deletePayment);

export default router;
