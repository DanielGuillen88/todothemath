/**
 * Comprueba si un usuario es miembro participante del proyecto
 * @param {Object} project 
 * @param {string|Object} userId 
 * @returns {boolean}
 */
export const isProjectMember = (project, userId) => {
  if (!project || !userId) return false;
  const currentUserId = String(userId?._id || userId?.id || userId);

  return (
    Array.isArray(project.members) &&
    project.members.some((m) => {
      const memberId = String(m?._id || m?.id || m);
      return memberId === currentUserId;
    })
  );
};