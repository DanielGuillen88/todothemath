import { Project } from '../../models/Project.js';
import { ERROR_MESSAGES, BadRequestError } from '../../utils/errors/index.js';

// @desc    Crear un nuevo proyecto
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { title, description, type, budget, currency, settlementMode } = req.body;

    if (!title || !title.trim()) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT_TITLE_REQUIRED));
    }

    const project = await Project.create({
      title: title.trim(),
      description: description || '',
      type: type || 'trip',
      budget: Number(budget) || 0,
      currency: currency || 'EUR',
      settlementMode: settlementMode || 'direct', // 👈 'direct' por defecto para deudas 1 a 1
      owner: req.user._id,
      members: [req.user._id], // El creador entra automáticamente como participante
    });

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};