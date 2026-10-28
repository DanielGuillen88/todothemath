import api from './api';

// Crear un nuevo proyecto
export const createProject = (payload) => 
  api.post('/projects', payload);

// Obtener todos los proyectos del usuario (activos e invitaciones)
export const getProjects = () => api.get('/projects');

// Obtener detalles de un proyecto específico
export const getProjectById = (projectId) => 
  api.get(`/projects/${projectId}`);

// Añadir un participante al proyecto por email (crea invitación pending)
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
    data: { projectName },
  });
  return data;
};

// Aceptar invitación a un proyecto
export const acceptInvitation = async (projectId) => {
  const { data } = await api.post(`/projects/${projectId}/invitations/accept`);
  return data;
};

// Rechazar invitación a un proyecto
export const rejectInvitation = async (projectId) => {
  const { data } = await api.post(`/projects/${projectId}/invitations/reject`);
  return data;
};