import express from 'express';
import {
  getExpensesByProject,
  createExpense,
  getProjectBalances,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/auth.js';

// ¡IMPORTANTE!: mergeParams: true para heredar :projectId o :id desde projectRoutes
const router = express.Router({ mergeParams: true });

router.use(protect);

// /api/projects/:id/expenses/balances
router.get('/balances', getProjectBalances);

// /api/projects/:id/expenses
router
  .route('/')
  .get(getExpensesByProject)
  .post(createExpense);

// /api/projects/:id/expenses/:expenseId
router
  .route('/:expenseId')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;