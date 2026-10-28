import { Project } from '../../models/Project.js';
import { extractUserId } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, NotFoundError, BadRequestError } from '../../utils/errors/index.js';

// @desc    Aceptar invitación a un proyecto
// @route   POST /api/projects/:id/invitations/accept
// @access  Private
export const acceptInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user._id);

    const project = await Project.findById(id);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    const memberEntry = project.members.find(
      (m) => extractUserId(m) === currentUserId && m.status === 'pending'
    );

    if (!memberEntry) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_INVITATION));
    }

    memberEntry.status = 'accepted';
    memberEntry.joinedAt = new Date();
    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      status: 'success',
      message: '✅ Te has unido al proyecto con éxito.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};