import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient, addContact, revealClientPassword } from '../controllers/clients.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/contacts', addContact);
router.get('/:id/reveal-password', requireRole('admin', 'manager'), revealClientPassword);

export default router;
