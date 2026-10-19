/**
 * Calcula la cuota por persona para un gasto compartido comprobando si el usuario actual participa.
 * @param {object} expense
 * @param {Array} projectMembers
 * @param {Function} isMeFunc
 * @returns {number}
 */
export const calculateDynamicShare = (expense, projectMembers = [], isMeFunc) => {
  if (!expense || expense.isPersonal) return 0;

  const splits = Array.isArray(expense.splitBetween) ? expense.splitBetween : [];
  const isParticipant = splits.length > 0
    ? splits.some((item) => (typeof isMeFunc === 'function' ? isMeFunc(item.user) : false))
    : true;

  if (!isParticipant) return 0;

  const totalMembers = splits.length > 0 ? splits.length : (projectMembers.length || 1);
  return Number(expense.amount || 0) / totalMembers;
};