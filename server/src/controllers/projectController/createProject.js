import { Project } from '../../models/Project.js';
import { ERROR_MESSAGES, BadRequestError } from '../../utils/errors/index.js';

// @desc    Crear un nuevo proyecto
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { title, description, budget, currency, type } = req.body;

    if (!title || !title.trim()) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.TITLE_REQUIRED));
    }

    const project = await Project.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      budget: budget !== undefined && budget !== '' ? Number(budget) : 0,
      currency: currency || 'EUR',
      type: type || 'trip',
      owner: req.user._id,
      members: [req.user._id], // El creador entra automáticamente como participante
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(201).json({
      status: 'success',
      data: { project: populatedProject },
    });
  } catch (error) {
    next(error);
  }
};