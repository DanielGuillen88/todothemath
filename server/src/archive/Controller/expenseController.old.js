import { Expense } from '../models/Expense.js';
import { Project } from '../models/Project.js';
import { calculateBalances } from '../services/balanceService.js';
import { buildExpenseSplit, findVisibleProjectExpenses, canModifyExpense } from '../services/expenseService.js';

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

    // Payer: si es personal siempre es quien lo crea, si es compartido puede ser otro miembro
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

// @desc    Obtener resumen financiero, balances y liquidación de deudas
// @route   GET /api/projects/:projectId/balances
// @access  Private
export const getProjectBalances = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('members', 'name email');
    if (!project) {
      res.status(404);
      throw new Error('😵 Resumen de proyecto no encontrado');
    }

    const expenses = await Expense.find({ project: projectId });

    // Delegamos al servicio (que ya descarta automáticamente los gastos personales)
    const balanceSummary = calculateBalances(expenses, project.members);

    res.status(200).json({
      status: 'success',
      data: {
        projectId,
        budget: project.budget,
        currency: project.currency,
        ...balanceSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
    if (paidBy !== undefined) expense.paidBy = paidBy;

    const targetAmount = amount !== undefined ? Number(amount) : expense.amount;
    if (targetAmount <= 0) {
      res.status(400);
      throw new Error('El importe debe ser superior a 0');
    }
    expense.amount = targetAmount;

    if (isPersonal !== undefined) {
      expense.isPersonal = Boolean(isPersonal);
    }

    // Recalcular el reparto si cambió el importe, la privacidad o el split explícito
    expense.splitBetween = buildExpenseSplit(
      expense.amount,
      expense.isPersonal,
      expense.paidBy,
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