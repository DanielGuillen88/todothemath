import { Expense } from '../../models/Expense.js';

/**
 * Obtiene los gastos visibles para el usuario autenticado según reglas de privacidad:
 * - Gasto personal: solo lo ve en su lista quien lo pagó/creó.
 * - Gasto compartido: solo lo ven quienes participan (quien lo pagó o quien está en splitBetween).
 * 
 * @param {string} projectId 
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export const findVisibleProjectExpenses = async (projectId, userId) => {
  return await Expense.find({
    project: projectId,
    isSettlement: { $ne: true },
    $or: [
      // 1. Personal: solo para quien lo pagó
      { 
        isPersonal: true, 
        paidBy: userId 
      },
      // 2. Compartido: solo para los involucrados (pagador o participante del reparto)
      { 
        isPersonal: false, 
        $or: [
          { paidBy: userId },
          { 'splitBetween.user': userId },
        ],
      },
    ],
  })
    .sort({ date: -1, createdAt: -1 })
    .populate('paidBy', 'name email')
    .populate('splitBetween.user', 'name email');
};