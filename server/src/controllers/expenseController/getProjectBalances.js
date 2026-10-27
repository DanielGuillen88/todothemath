import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { Settlement } from '../../models/Settlement.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { calculateBalances } from '../../services/balanceService.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

export const getProjectBalances = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) throw new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND);

    if (!hasProjectAccess(project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS);
    }

    // Buscamos gastos ordinarios (filtrando explícitamente posibles viejos settlements) y liquidaciones reales
    const [expenses, settlementsList] = await Promise.all([
      Expense.find({ 
        project: projectId, 
        isPersonal: false,
        isSettlement: { $ne: true } // 👈 Filtra cualquier gasto que fuera liquidación legacy
      })
        .populate('paidBy', 'name email')
        .populate('splitBetween.user', 'name email'),
      Settlement.find({ project: projectId })
        .populate('from', 'name email')
        .populate('to', 'name email'),
    ]);

    // Aseguramos que el owner esté en la lista si por error no figuraba en members
    const allMembers = [...(project.members || [])];
    if (project.owner && !allMembers.some((m) => String(m._id || m) === String(project.owner._id || project.owner))) {
      allMembers.push(project.owner);
    }

    const balanceSummary = calculateBalances(expenses, settlementsList, allMembers);

    res.status(200).json({
      status: 'success',
      data: balanceSummary,
    });
  } catch (error) {
    console.error('Error obteniendo balances del proyecto:', error);
    next(error);
  }
};