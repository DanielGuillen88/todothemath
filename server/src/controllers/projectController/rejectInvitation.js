import { Project } from '../../models/Project.js';
import { extractUserId } from '../../services/projectService/index.js';
import { ERROR_MESSAGES, NotFoundError, BadRequestError } from '../../utils/errors/index.js';

// @desc    Rechazar invitación a un proyecto
// @route   POST /api/projects/:id/invitations/reject
// @access  Private
export const rejectInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user._id);

    const project = await Project.findById(id);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    const initialLength = project.members.length;
    project.members = project.members.filter(
      (m) => !(extractUserId(m) === currentUserId && m.status === 'pending')
    );

    if (project.members.length === initialLength) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_INVITATION));
    }

    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Invitación rechazada.',
    });
  } catch (error) {
    next(error);
  }
};