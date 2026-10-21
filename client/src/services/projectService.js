import api from './api';

// Obtener todos los proyectos del usuario
export const getProjectById = (projectId) => 
  api.get(`/projects/${projectId}`);

// Añadir un participante al proyecto por email
export const addMemberToProject = async (projectId, email) => {
  const { data } = await api.post(`/projects/${projectId}/members`, { email });
  return data;
};

// Eliminar un miembro de un proyecto
export const removeMemberFromProject = async (projectId, memberId) => {
  const { data } = await api.delete(`/projects/${projectId}/members/${memberId}`);
  return data;
};