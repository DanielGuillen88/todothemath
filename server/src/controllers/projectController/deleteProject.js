import { Project } from '../../models/Project.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError, BadRequestError  } from '../../utils/errors/index.js';
import { Expense } from '../../models/Expense.js';
import { Settlement } from '../../models/Settlement.js';

// @desc    Eliminar un proyecto y sus gastos asociados
// @route   DELETE /api/projects/:id
// @access  Private (Solo el owner)
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectName } = req.body;
    const project = await Project.findById(id);
    if (!project) return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));

    if (String(project.owner) !== String(req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_DELETE));
    }

    // 🔒 Validación estricta del nombre (insensible a mayúsculas/minúsculas y espacios)
    const currentName = project.title || project.name || '';
    if (projectName?.trim().toLowerCase() !== currentName.trim().toLowerCase()) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_MATCHING_NAME));
    }

    // Eliminación en cascada de proyecto y gastos asociados
    await Promise.all([
      Expense.deleteMany({ project: id }),
      Settlement.deleteMany({ project: id }),
      Project.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      status: 'success',
      message: '✅ Proyecto y gastos asociados eliminados correctamente'
    });
  } catch (error) {
    next(error);
  }
};