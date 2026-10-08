import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { buildExpenseSplit } from '../../services/expenseService/index.js';

// @desc    Crear un gasto en un proyecto
// @route   POST /api/projects/:projectId/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, amount, splitBetween, category, date, isPersonal, paidBy } = req.body;

    const numAmount = Number(amount);
    if (!title || !numAmount || numAmount <= 0) {
      res.status(400);
      throw new Error('💶 Debes indicar un concepto válido y un importe superior a 0');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('🙃 Proyecto no encontrado');
    }

    const payerId = Boolean(isPersonal) ? req.user._id : (paidBy || req.user._id);

    const finalSplit = buildExpenseSplit(
      numAmount,
      isPersonal,
      payerId,
      project.members,
      splitBetween
    );

    const expense = await Expense.create({
      project: projectId,
      title: title.trim(),
      amount: numAmount,
      paidBy: payerId,
      splitBetween: finalSplit,
      category: category || 'General',
      date: date || Date.now(),
      isPersonal: Boolean(isPersonal),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.status(201).json({
      status: 'success',
      data: { expense: populatedExpense },
    });
  } catch (error) {
    next(error);
  }
};