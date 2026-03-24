import { Router } from 'express';
import {
  getProducts, createProduct, updateProduct, addPlan, regenerateApiSecret,
  getNotes, addNote, deleteNote, revealAdminPassword,
} from '../controllers/products.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.post('/:id/plans', addPlan);
router.post('/:id/regenerate-secret', regenerateApiSecret);

// Vault - reveal password (admin/manager only)
router.get('/:id/reveal-password', requireRole('admin', 'manager'), revealAdminPassword);

// Notes
router.get('/:id/notes', getNotes);
router.post('/:id/notes', addNote);
router.delete('/:id/notes/:noteId', deleteNote);

export default router;
