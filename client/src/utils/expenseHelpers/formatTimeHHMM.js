/**
 * Formatea una fecha en hora local corta (HH:MM).
 * @param {string|Date} dateStr
 * @returns {string}
 */
export const formatTimeHHMM = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};