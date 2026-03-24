import { Router } from 'express';
import { getProspects, getProspect, createProspect, updateProspect, deleteProspect, addQuote, updateQuote, deleteQuote } from '../controllers/prospects.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getProspects);
router.get('/:id', getProspect);
router.post('/', createProspect);
router.put('/:id', updateProspect);
router.delete('/:id', deleteProspect);
router.post('/:id/quotes', addQuote);
router.put('/:id/quotes/:qid', updateQuote);
router.delete('/:id/quotes/:qid', deleteQuote);

export default router;
