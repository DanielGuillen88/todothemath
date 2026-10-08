import { Expense } from '../../models/Expense.js';

/**
 * Obtiene los gastos visibles para el usuario autenticado según reglas de privacidad:
 * - Gastos compartidos: visibles para todos los miembros.
 * - Gastos personales: visibles ÚNICAMENTE para quien los pagó.
 * 
 * @param {string} projectId 
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const findVisibleProjectExpenses = async (projectId, userId) => {
  const filter = {
    project: projectId,
    $or: [
      { isPersonal: false },
      { isPersonal: { $exists: false } },
      { isPersonal: true, paidBy: userId }
    ]
  };

  return await Expense.find(filter)
    .populate('paidBy', 'name email')
    .populate('splitBetween.user', 'name email')
    .sort({ date: -1, createdAt: -1 });
};