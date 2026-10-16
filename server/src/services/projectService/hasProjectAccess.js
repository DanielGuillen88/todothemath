import { isProjectMember, isProjectOwner } from './index.js';

/**
 * Comprueba si un usuario tiene acceso (como miembro o como owner)
 * @param {Object} project 
 * @param {string|Object} userId 
 * @returns {boolean}
 */
export const hasProjectAccess = (project, userId) => {
  return isProjectOwner(project, userId) || isProjectMember(project, userId);
};