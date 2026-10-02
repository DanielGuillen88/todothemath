import { Router } from 'express';
import {
  createExpense,
  getExpensesByProject,
  getProjectBalances,
  deleteExpense,
  updateExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/auth.js';

// mergeParams permite acceder al :projectId definido en el router superior
const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .post(createExpense)
  .get(getExpensesByProject);

router.route('/balances')
  .get(getProjectBalances);

router.route('/:expenseId')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;