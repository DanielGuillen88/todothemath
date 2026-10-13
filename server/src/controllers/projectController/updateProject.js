import { Project } from '../../models/Project.js';
import { isProjectOwner } from '../../services/projectService/index.js';

// @desc    Actualizar información del proyecto
// @route   PUT /api/projects/:id
// @access  Private (Solo el owner)
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ status: 'fail', message: 'ID de proyecto no válido' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
    }

    if (!isProjectOwner(project, req.user._id)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para editar este proyecto'
      });
    }

    const { title, description, budget, currency, type } = req.body;
    if (title) project.title = title.trim();
    if (description !== undefined) project.description = description;
    if (budget !== undefined) project.budget = Number(budget) || 0;
    if (currency) project.currency = currency;
    if (type) project.type = type;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      status: 'success',
      data: { project: updated }
    });
  } catch (error) {
    next(error);
  }
};