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
  return await Expense.find({
    project: projectId,
    isSettlement: { $ne: true }, // Excluye liquidaciones antiguas si quedaron en BD
    $or: [
      { isPersonal: false },                // Gastos compartidos: visibles para todos
      { isPersonal: true, paidBy: userId }, // Gastos personales: solo para quien lo pagó
    ],
  })
    .sort({ date: -1, createdAt: -1 })
    .populate('paidBy', 'name email')
    .populate('splitBetween.user', 'name email');
};