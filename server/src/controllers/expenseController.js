import { Expense } from '../models/Expense.js';
import { Project } from '../models/Project.js';
import { calculateBalancesAndDebts } from '../services/balanceService.js';

// @desc    Crear un gasto en un proyecto
// @route   POST /api/projects/:projectId/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, amount, splitBetween, category, date } = req.body;

    if (!title || !amount || amount <= 0) {
      res.status(400);
      throw new Error('💶 Debes indicar un concepto válido y un importe superior a 0');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error('🙃 Proyecto no encontrado');
    }

    // Comprobar que el usuario pertenece al proyecto
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      throw new Error('⛔️ No tienes permiso para añadir gastos en este proyecto');
    }

    // Si no se define un reparto personalizado, se divide a partes iguales entre todos los miembros
    let finalSplit = splitBetween;
    if (!finalSplit || finalSplit.length === 0) {
      const sharePerMember = Number((amount / project.members.length).toFixed(2));
      finalSplit = project.members.map((memberId) => ({
        user: memberId,
        share: sharePerMember
      }));
    }

    const expense = await Expense.create({
      project: projectId,
      title,
      amount,
      paidBy: req.user._id,
      splitBetween: finalSplit,
      category: category || 'General',
      date: date || Date.now()
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.status(201).json({
      status: 'success',
      data: { expense: populatedExpense }
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

    // Delegamos el cómputo financiero al servicio
    const balanceSummary = calculateBalancesAndDebts(expenses, project.members);

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