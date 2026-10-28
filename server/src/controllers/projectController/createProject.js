import { Project } from '../../models/Project.js';
import { ERROR_MESSAGES, BadRequestError } from '../../utils/errors/index.js';

// @desc    Crear un nuevo proyecto
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { title, description, budget, currency, type } = req.body;
    const currentUserId = req.user._id;

    if (!title || !title.trim()) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.TITLE_REQUIRED));
    }

    const project = await Project.create({
          title,
          description,
          type,
          currency,
          budget,
          owner: currentUserId,
          members: [
            {
              user: currentUserId,
              role: 'owner',
              status: 'accepted',
              joinedAt: new Date(),
            },
          ],
        });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({
      status: 'success',
      data: { project: populatedProject },
    });
  } catch (error) {
    next(error);
  }
};