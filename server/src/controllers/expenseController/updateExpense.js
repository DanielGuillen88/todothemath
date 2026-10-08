import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { buildExpenseSplit, canModifyExpense } from '../../services/expenseService/index.js';

// @desc    Actualizar un gasto
// @route   PUT /api/projects/:projectId/expenses/:expenseId
// @access  Private

export const updateExpense = async (req, res, next) => {
  try {
    const { projectId, expenseId } = req.params;
    const { title, amount, category, date, isPersonal, splitBetween, paidBy } = req.body;

    const [expense, project] = await Promise.all([
      Expense.findOne({ _id: expenseId, project: projectId }),
      Project.findById(projectId)
    ]);

    if (!expense || !project) {
      res.status(404);
      throw new Error('Gasto o proyecto no encontrado');
    }

    if (!canModifyExpense(expense, project, req.user._id)) {
      res.status(403);
      throw new Error('No tienes permiso para modificar este gasto');
    }

    if (title !== undefined) expense.title = title.trim();
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    
    // Normalizar pagador
    if (paidBy !== undefined) {
      expense.paidBy = String(paidBy?._id || paidBy?.id || paidBy);
    }

    const targetAmount = amount !== undefined ? Number(amount) : expense.amount;
    if (targetAmount <= 0) {
      res.status(400);
      throw new Error('El importe debe ser superior a 0');
    }
    expense.amount = targetAmount;

    if (isPersonal !== undefined) {
      expense.isPersonal = Boolean(isPersonal);
    }

    // Extraer solo el ID de quien paga para el cálculo de reparto
    const payerId = String(expense.paidBy?._id || expense.paidBy?.id || expense.paidBy);

    expense.splitBetween = buildExpenseSplit(
      expense.amount,
      expense.isPersonal,
      payerId,
      project.members,
      splitBetween
    );

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.status(200).json({
      status: 'success',
      data: { expense: populatedExpense },
    });
  } catch (error) {
    next(error);
  }
};