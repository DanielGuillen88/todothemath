import { Project } from '../../models/Project.js';

// @desc    Obtener todos los proyectos del usuario autenticado
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }, // 👈 Nueva estructura con subdocumentos
        { members: userId }         // Fallback para colecciones no migradas
      ]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email') // 👈 Poblar nombre y email de participantes
      .populate('members', 'name email')     // Fallback
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};