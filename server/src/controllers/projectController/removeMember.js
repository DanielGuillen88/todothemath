import { Project } from '../../models/Project.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Eliminar un miembro de un proyecto
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, memberId } = req.params;
    const currentUserId = req.user._id.toString();

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    // 1. Solo el creador/propietario puede expulsar miembros
    if (project.owner.toString() !== currentUserId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    // 2. El dueño no puede autoexpulsarse por esta vía
    if (project.owner.toString() === memberId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_REMOVE_OWNER));
    }

    // 3. Comprobar que el usuario pertenece al proyecto
    const isMember = project.members.some((m) => m.toString() === memberId);
    if (!isMember) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_MEMBER));
    }

    // 4. Eliminar del array de miembros
    project.members = project.members.filter((m) => m.toString() !== memberId);
    await project.save();

    // 5. Devolvemos el proyecto poblado
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.json({
      message: '✅ Miembro eliminado con éxito',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};