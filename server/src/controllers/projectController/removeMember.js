import { Project } from '../../models/Project.js';
import { Expense } from '../../models/Expense.js';
import { Settlement } from '../../models/Settlement.js';
import { extractUserId } from '../../services/projectService/extractUserId.js';
import {
  ERROR_MESSAGES,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors/index.js';

// @desc    Eliminar un miembro de un proyecto
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, memberId } = req.params;
    const currentUserId = req.user._id.toString();
    const targetMemberId = String(memberId).trim();

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    const ownerId = extractUserId(project.owner);

    // 1. Solo el creador/propietario puede expulsar miembros
    if (ownerId !== currentUserId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    // 2. El dueño no puede autoexpulsarse por esta vía
    if (ownerId === targetMemberId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_REMOVE_OWNER));
    }

    // 3. Comprobar que el usuario pertenece al proyecto (soporta subdocumentos y formato plano)
    const isMember = Array.isArray(project.members) && project.members.some((m) => {
      const uId = extractUserId(m?.user || m);
      return uId === targetMemberId;
    });

    if (!isMember) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_MEMBER));
    }

    // 4. Verificación de integridad financiera:
    // ¿Pagó algún gasto en este proyecto?
    const paidExpensesCount = await Expense.countDocuments({
      project: projectId,
      paidBy: targetMemberId,
    });

    if (paidExpensesCount > 0) {
      return next(
        new BadRequestError(ERROR_MESSAGES.PROJECT.PENDING_SETTLEMENTS)
      );
    }

    // ¿Forma parte del reparto (splitBetween) de algún gasto compartido?
    const splitExpensesCount = await Expense.countDocuments({
      project: projectId,
      isPersonal: false,
      'splitBetween.user': targetMemberId,
    });

    if (splitExpensesCount > 0) {
      return next(
        new BadRequestError(ERROR_MESSAGES.PROJECT.PENDING_SETTLEMENTS)
      );
    }

    // ¿Tiene liquidaciones registradas (pagadas o recibidas)?
    const settlementsCount = await Settlement.countDocuments({
      project: projectId,
      $or: [{ from: targetMemberId }, { to: targetMemberId }],
    });

    if (settlementsCount > 0) {
      return next(
        new BadRequestError(ERROR_MESSAGES.PROJECT.PENDING_SETTLEMENTS)
      );
    }

    // 5. Eliminar del array de miembros (soporta subdocumentos y formato legacy)
    project.members = project.members.filter((m) => {
      const uId = extractUserId(m?.user || m);
      return uId !== targetMemberId;
    });

    await project.save();

    // 6. Devolvemos el proyecto correctamente poblado
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('members', 'name email');

    res.json({
      status: 'success',
      message: '✅ Miembro eliminado con éxito',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};