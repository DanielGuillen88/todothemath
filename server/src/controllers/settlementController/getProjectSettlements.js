import { Settlement } from '../../models/Settlement.js';
import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { NotFoundError, ForbiddenError, ERROR_MESSAGES } from '../../utils/errors/index.js';

// @desc    Obtener el historial de liquidaciones de un proyecto
// @route   GET /api/projects/:projectId/settlements
export const getProjectSettlements = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));

    if (!hasProjectAccess(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS));
    }

    const settlements = await Settlement.find({ project: projectId })
      .sort({ date: -1, createdAt: -1 })
      .populate('from', 'name email')
      .populate('to', 'name email');

    res.status(200).json({
      status: 'success',
      data: { settlements },
    });
  } catch (error) {
    next(error);
  }
};