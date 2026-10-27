import { Settlement } from '../../models/Settlement.js';
import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { NotFoundError, ForbiddenError, ERROR_MESSAGES } from '../../utils/errors/index.js';

// @desc    Revertir una liquidación
// @route   DELETE /api/projects/:projectId/settlements/:settlementId
export const deleteSettlement = async (req, res, next) => {
  try {
    const { projectId, settlementId } = req.params;
    const currentUserId = String(req.user._id);

    const project = await Project.findById(projectId);
    if (!project) return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));

    if (!hasProjectAccess(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS));
    }

    const settlement = await Settlement.findOne({
      _id: settlementId,
      project: projectId,
    });

    if (!settlement) {
      return next(new NotFoundError(ERROR_MESSAGES.EXPENSE.SETTLEMENT_NOT_FOUND));
    }

    // Solo el dueño del proyecto o quien pagó/recibió la liquidación pueden deshacerla
    const isOwner = String(project.owner) === currentUserId;
    const isParty = String(settlement.from) === currentUserId || String(settlement.to) === currentUserId;

    if (!isOwner && !isParty) {
      return next(new ForbiddenError(ERROR_MESSAGES.EXPENSE.SETTLEMENT_FORBIDDEN));
    }

    await Settlement.findByIdAndDelete(settlementId);

    res.status(200).json({
      status: 'success',
      message: '✅ Liquidación revertida con éxito',
    });
  } catch (error) {
    next(error);
  }
};