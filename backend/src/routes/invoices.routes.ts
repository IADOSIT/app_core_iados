import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoiceStatus } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);

export default router;
