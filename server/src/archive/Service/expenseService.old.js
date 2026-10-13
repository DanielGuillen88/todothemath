import { Expense } from '../models/Expense.js';
import { Project } from '../models/Project.js';

/**
 * Almacena gasto segun si es personal o compartido
 */
export const buildExpenseSplit = (amount, isPersonal, userId, projectMembers, customSplit) => {
  const numAmount = Number(amount);

  if (Boolean(isPersonal)) {
    return [{ user: userId, share: numAmount }];
  }

  if (Array.isArray(customSplit) && customSplit.length > 0) {
    return customSplit;
  }

  const membersCount = projectMembers?.length || 1;
  const sharePerMember = Number((numAmount / membersCount).toFixed(2));

  return projectMembers.map((memberId) => ({
    user: memberId,
    share: sharePerMember,
  }));
};

/**
 * Obtiene los gastos visibles para el usuario según reglas de privacidad
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

/**
 * Que usuario podra modificar o eliminar un gasto
 */
export const canModifyExpense = (expense, project, userId) => {
  const userIdStr = userId.toString();
  const payerIdStr = expense.paidBy?.toString();
  const ownerIdStr = (project?.owner?._id || project?.owner)?.toString();

  return payerIdStr === userIdStr || ownerIdStr === userIdStr;
};