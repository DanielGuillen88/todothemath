import { extractUserId } from './extractUserId.js';

/**
 * Comprueba si un usuario es miembro con invitación aceptada o el creador del proyecto
 * 
 * @param {Object} project - Documento de proyecto de Mongoose
 * @param {string|ObjectId} userId - ID del usuario a validar
 * @returns {boolean}
 */
export const hasProjectAccess = (project, userId) => {
  if (!project || !userId) return false;

  const targetId = String(userId).trim();
  const ownerId = extractUserId(project.owner?._id || project.owner);

  // 1. El creador siempre tiene acceso total
  if (ownerId === targetId) return true;

  // 2. Comprobar miembros
  if (Array.isArray(project.members)) {
    return project.members.some((m) => {
      // Soporta subdocumento poblado (m.user), sin poblar (m.user), o esquema legacy directo (m)
      const memberUserData = m?.user || m;
      const mId = extractUserId(memberUserData?._id || memberUserData?.id || memberUserData);

      // Si tiene campo status, requiere estar aceptado; si no tiene status (legacy), se asume aceptado
      const isAccepted = m?.status ? m.status === 'accepted' : true;

      return mId === targetId && isAccepted;
    });
  }

  return false;
};