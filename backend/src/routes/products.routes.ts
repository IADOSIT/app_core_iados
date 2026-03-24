import { Router } from 'express';
import { getProducts, createProduct, updateProduct, addPlan, regenerateApiSecret } from '../controllers/products.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.post('/:id/plans', addPlan);
router.post('/:id/regenerate-secret', regenerateApiSecret);

export default router;
