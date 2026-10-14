import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { findVisibleProjectExpenses } from '../../services/expenseService/index.js';
import { ERROR_MESSAGES, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Obtener los gastos de un proyecto (filtrando privacidad)
// @route   GET /api/projects/:projectId/expenses
// @access  Private
export const getExpensesByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Validación del ID del proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND);
    }

    // Evita que usuarios ajenos vean los gastos del proyecto
    if (!hasProjectAccess(project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS);
    }

    // Obtenemos los gastos visibles para el usuario en el proyecto
    const expenses = await findVisibleProjectExpenses(projectId, req.user._id);

    res.status(200).json({
      status: 'success',
      results: expenses.length,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
};