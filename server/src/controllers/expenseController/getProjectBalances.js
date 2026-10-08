import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { calculateBalancesAndDebts } from '../../services/balanceService.js';

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

    const balanceSummary = calculateBalancesAndDebts(expenses, project.members);

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