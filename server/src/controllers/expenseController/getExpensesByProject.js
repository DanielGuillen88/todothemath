import { findVisibleProjectExpenses } from '../../services/expenseService/index.js';

// @desc    Obtener los gastos de un proyecto (filtrando privacidad)
// @route   GET /api/projects/:projectId/expenses
// @access  Private
export const getExpensesByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const expenses = await findVisibleProjectExpenses(projectId, req.user._id);

    res.status(200).json({
      status: 'success',
      results: expenses.length,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
};