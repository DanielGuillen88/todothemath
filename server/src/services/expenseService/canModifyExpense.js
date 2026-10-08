/**
 * Verifica si un usuario tiene permisos para modificar o eliminar un gasto
 * Regla: Solo quien pagó el gasto o el creador del proyecto.
 * 
 * @param {Object} expense 
 * @param {Object} project 
 * @param {string} userId 
 */
export const canModifyExpense = (expense, project, userId) => {
  if (!expense || !userId) return false;

  const currentUserId = String(userId?._id || userId?.id || userId);
  const payerId = String(expense.paidBy?._id || expense.paidBy?.id || expense.paidBy || '');
  const ownerId = String(project?.owner?._id || project?.owner?.id || project?.owner || '');

  return payerId === currentUserId || ownerId === currentUserId;
};