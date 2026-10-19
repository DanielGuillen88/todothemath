import { extractEntityId } from './index.js';

/**
 * Recalcula el array de splitBetween con un nuevo importe manteniendo los mismos participantes.
 * @param {Array} currentSplit
 * @param {number} newAmount
 * @returns {Array|undefined}
 */
export const buildRecalculatedSplit = (currentSplit, newAmount) => {
  if (!Array.isArray(currentSplit) || currentSplit.length === 0) {
    return undefined;
  }

  const sharePerPerson = Number((newAmount / currentSplit.length).toFixed(2));

  return currentSplit.map((item) => ({
    user: extractEntityId(item.user || item),
    share: sharePerPerson,
  }));
};