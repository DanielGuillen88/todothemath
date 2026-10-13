/**
 * Comprueba si un usuario es el propietario (owner) del proyecto
 * @param {Object} project 
 * @param {string|Object} userId 
 * @returns {boolean}
 */
export const isProjectOwner = (project, userId) => {
  if (!project || !userId) return false;
  const ownerId = String(project.owner?._id || project.owner || '');
  const currentUserId = String(userId?._id || userId?.id || userId);
  return ownerId === currentUserId;
};