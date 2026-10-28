// Elimina un proyecto y todos sus gastos asociados en la base de datos
export { deleteProjectCascade } from './deleteProjectCascade.js';
// Extrae el ObjectId en formato string sin importar si viene como string, ObjectId o subdocumento
export { extractUserId } from './extractUserId.js'
// Comprueba si un usuario es miembro con invitación aceptada o el creador
export { hasProjectAccess } from './hasProjectAccess.js';
// Comprueba si un usuario es miembro participante del proyecto
export { isProjectMember } from './isProjectMember.js';
// Comprueba si un usuario es el propietario (owner) del proyecto
export { isProjectOwner } from './isProjectOwner.js';