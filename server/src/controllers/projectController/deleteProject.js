import { Project } from '../../models/Project.js';
import { isProjectOwner, deleteProjectCascade } from '../../services/projectService/index.js';

// @desc    Eliminar un proyecto y sus gastos asociados
// @route   DELETE /api/projects/:id
// @access  Private (Solo el owner)
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
    }

    if (!isProjectOwner(project, req.user._id)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para eliminar este proyecto (solo el creador puede hacerlo)'
      });
    }

    // Eliminación en cascada de proyecto y gastos asociados
    await deleteProjectCascade(project);

    res.status(200).json({
      status: 'success',
      message: 'Proyecto y gastos asociados eliminados correctamente'
    });
  } catch (error) {
    next(error);
  }
};