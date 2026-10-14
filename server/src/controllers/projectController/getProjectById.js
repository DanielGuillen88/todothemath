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
      // return res.status(400).json({ status: 'fail', message: 'ID de proyecto no válido' });
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.INVALID_ID));
    }

    const project = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      // return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    if (!hasProjectAccess(project, req.user._id)) {
      // return res.status(403).json({ status: 'fail', message: 'No tienes acceso a este proyecto' });
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