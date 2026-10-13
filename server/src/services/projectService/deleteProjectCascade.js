import { Expense } from '../../models/Expense.js';

/**
 * Elimina un proyecto y todos sus gastos asociados en la base de datos
 * @param {Object} project 
 * @returns {Promise<void>}
 */
export const deleteProjectCascade = async (project) => {
  if (!project?._id) return;
  await Expense.deleteMany({ project: project._id });
  await project.deleteOne();
};