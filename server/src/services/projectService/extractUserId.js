/**
 * Extrae el ObjectId en formato string sin importar si viene como string, ObjectId o subdocumento
 */
export const extractUserId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity.trim();
  if (entity._id) return String(entity._id).trim();
  if (entity.id) return String(entity.id).trim();
  if (entity.user) return extractUserId(entity.user);
  return String(entity).trim();
};