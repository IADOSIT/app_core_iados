import { Router } from 'express';
import { getExpenses, getExpenseStats, createExpense, updateExpense, deleteExpense, getCategories } from '../controllers/expenses.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/categories', getCategories);
router.get('/stats', getExpenseStats);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
