import { Expense } from '../models/Expense.js';
import { Project } from '../models/Project.js';
import { calculateBalancesAndDebts } from '../services/balanceService.js';

// @desc    Crear un gasto en un proyecto
// @route   POST /api/projects/:projectId/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, amount, splitBetween, category, date, isPersonal } = req.body;

    console.log('📌 Payload recibido en createExpense:', { title, amount, isPersonal, date });

    if (!title || !amount || amount <= 0) {
      res.status(400);
      throw new Error('💶 Debes indicar un concepto válido y un importe superior a 0');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('🙃 Proyecto no encontrado');
    }

    // Reparto según sea personal o compartido
    let finalSplit = splitBetween;
    if (Boolean(isPersonal)) {
      finalSplit = [{ user: req.user._id, share: Number(amount) }];
    } else if (!finalSplit || finalSplit.length === 0) {
      const sharePerMember = Number((amount / project.members.length).toFixed(2));
      finalSplit = project.members.map((memberId) => ({
        user: memberId,
        share: sharePerMember,
      }));
    }

    const expense = await Expense.create({
      project: projectId,
      title,
      amount,
      paidBy: req.user._id,
      splitBetween: finalSplit,
      category: category || 'General',
      date: date || Date.now(),
      isPersonal: Boolean(isPersonal), // <-- Asegurar conversión a booleano
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

// @desc    Obtener todos los gastos de un proyecto
// @route   GET /api/projects/:projectId/expenses
// @access  Private
export const getExpensesByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('😅 Gastos de proyecto no encontrado');
    }

    const expenses = await Expense.find({ project: projectId })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      results: expenses.length,
      data: { expenses }
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

    // AQUÍ VA LA LÍNEA: Excluir gastos personales de la liquidación de deudas
    const sharedExpenses = expenses.filter((exp) => !exp.isPersonal);

    // Delegamos el cómputo financiero pasando solo los gastos a repartir
    const balanceSummary = calculateBalancesAndDebts(sharedExpenses, project.members);

    res.status(200).json({
      status: 'success',
      data: {
        projectId,
        budget: project.budget,
        currency: project.currency,
        ...balanceSummary
      }
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

    const expense = await Expense.findOne({ _id: expenseId, project: projectId });
    if (!expense) {
      res.status(404);
      throw new Error('Gasto no encontrado');
    }

    // Solo quien pagó el gasto o el creador del proyecto puede borrarlo
    const isOwner = expense.paidBy.toString() === req.user._id.toString();
    if (!isOwner) {
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
    const { title, amount, category, date, isPersonal, splitBetween } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, project: projectId });
    if (!expense) {
      res.status(404);
      throw new Error('Gasto no encontrado');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('Proyecto no encontrado');
    }

    // Solo quien pagó el gasto o el creador del proyecto puede editarlo
    const isOwner = expense.paidBy.toString() === req.user._id.toString();
    const isCreator = project.creator && project.creator.toString() === req.user._id.toString();
    if (!isOwner && !isCreator) {
      res.status(403);
      throw new Error('No tienes permiso para modificar este gasto');
    }

    if (title !== undefined) expense.title = title.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (numAmount <= 0) {
        res.status(400);
        throw new Error('El importe debe ser superior a 0');
      }
      expense.amount = numAmount;
    }
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;

    if (isPersonal !== undefined) {
      expense.isPersonal = Boolean(isPersonal);
      if (expense.isPersonal) {
        expense.splitBetween = [{ user: expense.paidBy, share: expense.amount }];
      } else if (!splitBetween || splitBetween.length === 0) {
        const sharePerMember = Number((expense.amount / project.members.length).toFixed(2));
        expense.splitBetween = project.members.map((mId) => ({
          user: mId,
          share: sharePerMember,
        }));
      }
    }

    if (splitBetween && !expense.isPersonal) {
      expense.splitBetween = splitBetween;
    }

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