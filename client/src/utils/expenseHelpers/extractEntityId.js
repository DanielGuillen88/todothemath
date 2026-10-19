/**
 * Extrae el string limpio del ID de un usuario o pagador (maneja objetos de Mongo, strings o proxies).
 * @param {string|object} entity
 * @returns {string}
 */
export const extractEntityId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'object') {
    return String(entity._id || entity.id || '');
  }
  return String(entity);
};