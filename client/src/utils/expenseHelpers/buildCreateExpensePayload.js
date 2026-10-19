import { extractEntityId } from './extractEntityId.js';

/**
 * Genera el payload normalizado para crear un nuevo gasto.
 * @param {object} form
 * @param {Array} selectedMembers
 * @param {string} currentUserId
 * @returns {object}
 */
export const buildCreateExpensePayload = (form, selectedMembers = [], currentUserId = '') => {
  const numericAmount = Number(form.amount);
  const cleanCurrentUserId = extractEntityId(currentUserId);
  const cleanPaidBy = extractEntityId(form.paidBy) || cleanCurrentUserId;

  let splitPayload = [];
  if (!form.isPersonal && selectedMembers.length > 0) {
    const sharePerPerson = Number((numericAmount / selectedMembers.length).toFixed(2));
    splitPayload = selectedMembers.map((m) => ({
      user: extractEntityId(m),
      share: sharePerPerson,
    }));
  }

  return {
    title: form.title.trim(),
    amount: numericAmount,
    category: form.category || 'Otros',
    date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    isPersonal: Boolean(form.isPersonal),
    paidBy: form.isPersonal ? cleanCurrentUserId : cleanPaidBy,
    splitBetween: form.isPersonal ? undefined : splitPayload,
  };
};