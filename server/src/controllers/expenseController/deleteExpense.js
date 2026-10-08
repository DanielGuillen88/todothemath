import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { canModifyExpense } from '../../services/expenseService/index.js';

// @desc    Eliminar un gasto
// @route   DELETE /api/projects/:projectId/expenses/:expenseId
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const { projectId, expenseId } = req.params;

    const [expense, project] = await Promise.all([
      Expense.findOne({ _id: expenseId, project: projectId }),
      Project.findById(projectId)
    ]);

    if (!expense) {
      res.status(404);
      throw new Error('Gasto no encontrado');
    }

    if (!canModifyExpense(expense, project, req.user._id)) {
      res.status(403);
      throw new Error('No tienes permiso para eliminar este gasto');
    }

    await expense.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Gasto eliminado correctamente',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};