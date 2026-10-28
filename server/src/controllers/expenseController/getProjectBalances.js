import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { Settlement } from '../../models/Settlement.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { calculateBalances } from '../../services/balanceService.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';
import { extractUserId } from '../../services/projectService/extractUserId.js';

export const getProjectBalances = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('members', 'name email');

    if (!project) throw new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND);

    if (!hasProjectAccess(project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS);
    }

    const [expenses, settlementsList] = await Promise.all([
      Expense.find({ 
        project: projectId, 
        isPersonal: false,
        isSettlement: { $ne: true }
      })
        .populate('paidBy', 'name email')
        .populate('splitBetween.user', 'name email'),
      Settlement.find({ project: projectId })
        .populate('from', 'name email')
        .populate('to', 'name email'),
    ]);

    // Extraer usuarios activos válidos (excluyendo invitaciones pendientes)
    const normalizedMembers = [];
    const seenIds = new Set();

    // 1. Agregar owner
    if (project.owner) {
      const ownerId = extractUserId(project.owner);
      seenIds.add(ownerId);
      normalizedMembers.push(project.owner);
    }

    // 2. Agregar miembros aceptados
    if (Array.isArray(project.members)) {
      project.members.forEach((m) => {
        if (m?.status === 'pending' || m?.status === 'rejected') return;
        const userObj = m?.user || m;
        const uId = extractUserId(userObj);
        if (uId && !seenIds.has(uId)) {
          seenIds.add(uId);
          normalizedMembers.push(userObj);
        }
      });
    }

    const balanceSummary = calculateBalances(expenses, settlementsList, normalizedMembers);

    res.status(200).json({
      status: 'success',
      data: balanceSummary,
    });
  } catch (error) {
    console.error('Error obteniendo balances del proyecto:', error);
    next(error);
  }
};