import api from './api';

// Registrar un pago/liquidación entre dos miembros
export const createSettlement = async (projectId, settlementData) => {
  const res = await api.post(`/projects/${projectId}/settlements`, settlementData);
  return res.data;
};

// Obtener el historial completo de pagos de un proyecto
export const getProjectSettlements = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/settlements`);
  return res.data;
};

// Revertir (eliminar) una liquidación
export const deleteSettlement = async (projectId, settlementId) => {
  const res = await api.delete(`/projects/${projectId}/settlements/${settlementId}`);
  return res.data;
};