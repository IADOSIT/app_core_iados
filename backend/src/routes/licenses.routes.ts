import { Router } from 'express';
import { getLicenses, getLicense, createLicense, updateLicense, activateLicense, renewLicense, deleteLicense } from '../controllers/licenses.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getLicenses);
router.get('/:id', getLicense);
router.post('/', createLicense);
router.put('/:id', updateLicense);
router.post('/:id/activate', activateLicense);
router.post('/:id/renew', renewLicense);
router.delete('/:id', deleteLicense);

export default router;
