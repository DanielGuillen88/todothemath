import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Obtener detalle de un proyecto por ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.INVALID_ID));
    }

    const project = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email') // 👈 Poblamos el usuario dentro del subdocumento
      .populate('members', 'name email');     // Fallback retrocompatible para proyectos antiguos

    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    if (!hasProjectAccess(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS));
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};