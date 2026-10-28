// server/controllers/projectController/addMemberToProject.js
import { Project } from '../../models/Project.js';
import { User } from '../../models/User.js';
import { isProjectMember, extractUserId } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

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

    // 1. Solo el creador/propietario puede invitar
    const ownerId = extractUserId(project.owner);
    if (ownerId !== currentUserId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    // 2. Buscar al usuario
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return next(new NotFoundError(ERROR_MESSAGES.AUTH.USER_NOT_FOUND));
    }

    const targetUserId = String(userToAdd._id);

    // 3. Comprobar si ya es owner o si ya está invitado/admitido
    if (ownerId === targetUserId) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.ALREADY_MEMBER));
    }

    const existingMember = project.members.find((m) => extractUserId(m) === targetUserId);
    if (existingMember) {
      if (existingMember.status === 'pending') {
        return next(new BadRequestError(ERROR_MESSAGES.PROJECT.PENDING_INVITATION));
      }
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.ALREADY_MEMBER));
    }

    // 4. Se añade con status: 'pending'
    project.members.push({
      user: userToAdd._id,
      role: 'member',
      status: 'pending',
      invitedAt: new Date(),
      joinedAt: null,
    });

    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      status: 'success',
      message: '📩 Invitación enviada. El participante debe aceptarla.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};