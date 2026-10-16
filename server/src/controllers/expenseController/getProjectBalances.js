import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { calculateBalances } from '../../services/balanceService.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Obtener resumen financiero, balances y liquidación de deudas
// @route   GET /api/projects/:projectId/expenses/balances
// @access  Private
export const getProjectBalances = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = await Project.findById(projectId).populate('members', 'name email');
    if (!project) {
      throw new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND);
    }

    if (!hasProjectAccess(project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS);
    }

    const expenses = await Expense.find({
      project: projectId,
      isPersonal: false,
    })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    const balanceSummary = calculateBalances(expenses, project.members);

    res.status(200).json({
      status: 'success',
      data: balanceSummary,
    });
  } catch (error) {
    console.error('Error obteniendo balances del proyecto:', error);
    next(error);
  }
};