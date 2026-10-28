import { Project } from '../../models/Project.js';
import { User } from '../../models/User.js';
import { isProjectMember } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Añadir un participante al proyecto por email
// @route   POST /api/projects/:id/members
// @access  Private (Solo Creador/Owner)
export const addMemberToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = String(req.user._id);

    if (!email) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.MEMBER_EMAIL_REQUIRED));
    }

    const project = await Project.findById(id);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    // 1. Autorización estricta: Solo el propietario puede añadir nuevos miembros
    const ownerId = String(project.owner?._id || project.owner);
    if (ownerId !== currentUserId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    // 2. Buscar al usuario a invitar
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return next(new NotFoundError(ERROR_MESSAGES.AUTH.USER_NOT_FOUND));
    }

    // 3. Evitar duplicados (ya sea miembro u owner)
    const targetUserId = String(userToAdd._id);
    if (ownerId === targetUserId || isProjectMember(project, userToAdd._id)) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.ALREADY_MEMBER));
    }

    project.members.push(userToAdd._id);
    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      status: 'success',
      message: '✅ Participante añadido correctamente.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};