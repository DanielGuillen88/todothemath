import { Project } from '../../models/Project.js';
import { User } from '../../models/User.js';
import { hasProjectAccess, isProjectMember } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Añadir un participante al proyecto por email
// @route   POST /api/projects/:id/members
// @access  Private
export const addMemberToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      // res.status(400);
      // throw new Error('Debes indicar el email del participante.');
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.MEMBER_EMAIL_REQUIRED));
    }

    const project = await Project.findById(id);
    if (!project) {
      // res.status(404);
      // throw new Error('Proyecto no encontrado.');
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    // Comprobar que quien invita tenga acceso al proyecto
    if (!hasProjectAccess(project, req.user._id)) {
      // res.status(403);
      // throw new Error('No tienes permisos para añadir miembros a este proyecto.');
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      // res.status(404);
      // throw new Error('No existe ningún usuario registrado con ese email.');
      return next(new NotFoundError(ERROR_MESSAGES.AUTH.USER_NOT_FOUND));
    }

    if (isProjectMember(project, userToAdd._id)) {
      // res.status(400);
      // throw new Error('El usuario ya forma parte de este proyecto.');
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