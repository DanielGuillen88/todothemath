import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { buildExpenseSplit } from '../../services/expenseService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Crear un gasto en un proyecto
// @route   POST /api/projects/:projectId/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, amount, splitBetween, category, date, isPersonal, paidBy } = req.body;

    const numAmount = Number(amount);
    if (!title || !numAmount || numAmount <= 0) {
      // res.status(400);
      // throw new Error('<tool_call> Debes indicar un concepto válido y un importe superior a 0');
      return next(new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_AMOUNT));
    }

    const project = await Project.findById(projectId);
    if (!project) {
      // res.status(404);
      // throw new Error('🙃 Proyecto no encontrado');
      throw new NotFoundError(ERROR_MESSAGES.EXPENSE.PROJECT_NOT_FOUND);
    }

    // 1. Evita que usuarios ajenos creen gastos en el proyecto
    if (!hasProjectAccess(project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS);
    }

    // 2. Determina quién es el pagador del gasto
    const rawPayer = Boolean(isPersonal) ? req.user._id : (paidBy || req.user._id);
    const cleanPayerId = String(rawPayer?._id || rawPayer?.id || rawPayer);

    // 3. Calculamos el reparto del gasto entre los miembros del proyecto
    const calculatedSplit = buildExpenseSplit(
      numAmount,
      isPersonal,
      cleanPayerId,
      project.members,
      splitBetween
    );

    // 4. Creamos el gasto en la base de datos
    const expense = await Expense.create({
      project: projectId,
      title: title.trim(),
      amount: numAmount,
      paidBy: cleanPayerId,
      splitBetween: calculatedSplit,
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