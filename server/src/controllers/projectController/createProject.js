import { Project } from '../../models/Project.js';

// @desc    Crear un nuevo proyecto
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { title, description, type, budget, currency } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error('😅 El título del proyecto es obligatorio');
    }

    const project = await Project.create({
      title: title.trim(),
      description: description || '',
      type: type || 'trip',
      budget: Number(budget) || 0,
      currency: currency || 'EUR',
      owner: req.user._id,
      members: [req.user._id] // El creador entra automáticamente como participante
    });

    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};