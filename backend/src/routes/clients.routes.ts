import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient, addContact } from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/contacts', addContact);

export default router;
