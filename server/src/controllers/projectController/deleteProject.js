import { Project } from '../../models/Project.js';
import { isProjectOwner, deleteProjectCascade } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Eliminar un proyecto y sus gastos asociados
// @route   DELETE /api/projects/:id
// @access  Private (Solo el owner)
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectName } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    if (!isProjectOwner(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_DELETE));
    }

    // 🔒 Validación estricta del nombre (insensible a mayúsculas/minúsculas y espacios)
    const storedName = (project.name || project.title || '').trim().toLowerCase();
    const providedName = (projectName || '').trim().toLowerCase();

    if (!providedName || providedName !== storedName) {
      return next(
        new BadRequestError(new Error(ERROR_MESSAGES.PROJECT.NOT_MATCHING_NAME))
      );
    }

    // Eliminación en cascada de proyecto y gastos asociados
    await deleteProjectCascade(project);

    res.status(200).json({
      status: 'success',
      message: '✅ Proyecto y gastos asociados eliminados correctamente'
    });
  } catch (error) {
    next(error);
  }
};