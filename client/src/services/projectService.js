import api from './api';

// Obtener todos los proyectos
export const getProjects = () => api.get('/projects');

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

// Actualizar un proyecto
export const updateProjectById = async (projectId, payload) => {
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return data;
};

// Eliminar un proyecto y sus gastos asociados
export const deleteProjectById = async (projectId, projectName) => {
  const { data } = await api.delete(`/projects/${projectId}`, {
    data: { projectName }, // 👈 Enviamos el nombre introducido en el body
  });
  return data;
};