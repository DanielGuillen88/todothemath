import { extractEntityId } from './extractEntityId.js';

/**
 * Genera el payload normalizado para crear un nuevo gasto.
 * @param {object} form
 * @param {Array} selectedMembers
 * @param {string} currentUserId
 * @returns {object}
 */
export const buildCreateExpensePayload = (form, selectedMembers = [], currentUserId = '') => {
  const numericAmount = Number(form.amount) || 0;
  const cleanCurrentUserId = extractEntityId(currentUserId);
  const cleanPaidBy = extractEntityId(form.paidBy) || cleanCurrentUserId;

  let splitPayload = [];

  if (!form.isPersonal && selectedMembers.length > 0) {
    // Calculamos en céntimos para evitar errores de coma flotante
    const totalCents = Math.round(numericAmount * 100);
    const baseCents = Math.floor(totalCents / selectedMembers.length);
    let remainderCents = totalCents % selectedMembers.length;

    splitPayload = selectedMembers.map((m) => {
      // Repartimos los céntimos sobrantes uno a uno entre los primeros participantes
      const shareCents = baseCents + (remainderCents > 0 ? 1 : 0);
      if (remainderCents > 0) remainderCents -= 1;

      return {
        user: extractEntityId(m),
        share: Number((shareCents / 100).toFixed(2)),
      };
    });
  }

  return {
    title: form.title?.trim() || '',
    amount: Number(numericAmount.toFixed(2)),
    category: form.category || 'Otros',
    date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    isPersonal: Boolean(form.isPersonal),
    paidBy: form.isPersonal ? cleanCurrentUserId : cleanPaidBy,
    splitBetween: form.isPersonal ? [] : splitPayload,
  };
};