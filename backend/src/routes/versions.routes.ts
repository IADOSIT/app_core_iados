import { Router } from 'express';
import { getVersions, createVersion, updateVersion, assignVersionToClient } from '../controllers/versions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getVersions);
router.post('/', createVersion);
router.put('/:id', updateVersion);
router.post('/assign', assignVersionToClient);

export default router;
