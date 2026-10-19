// Extrae el string limpio del ID de un usuario o pagador (maneja objetos de Mongo, strings o proxies).
export { extractEntityId } from './extractEntityId.js';

// Calcula la cuota por persona para un gasto compartido comprobando si el usuario actual participa.
export { calculateDynamicShare } from './calculateDynamicShare.js';

// Recalcula el array de splitBetween con un nuevo importe manteniendo los mismos participantes.
export { buildRecalculatedSplit } from './buildRecalculatedSplit.js';

// Formatea una fecha en hora local corta (HH:MM).
export { formatTimeHHMM } from './formatTimeHHMM.js';

// Genera el payload normalizado para crear un nuevo gasto.
export { buildExpensePayload } from './buildExpensePayload.js';