import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { NotFoundError, ForbiddenError, BadRequestError, ERROR_MESSAGES } from '../../utils/errors/index.js';

// @desc    Actualizar información del proyecto
// @route   PUT /api/projects/:id
// @access  Private (Solo el owner)
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, budget, currency, type } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    if (!hasProjectAccess(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS));
    }

    // Campos permitidos
    if (title !== undefined) {
      if (!title.trim()) {
        return next(new BadRequestError(ERROR_MESSAGES.PROJECT.TITLE_REQUIRED));
      }
      project.title = title.trim();
    }

    if (description !== undefined) project.description = description.trim();
    if (budget !== undefined) project.budget = budget !== '' ? Number(budget) : 0;
    if (currency !== undefined) project.currency = currency;
    if (type !== undefined) project.type = type;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      status: 'success',
      data: { project: updated },
    });
  } catch (error) {
    next(error);
  }
};