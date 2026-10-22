import api from './api';

// Obtener todos los gastos de un proyecto
export const getProjectExpenses = (projectId) => 
  api.get(`/projects/${projectId}/expenses`);

// Obtener resumen balances de deudas
export const getProjectBalances = (projectId) => 
  api.get(`/projects/${projectId}/expenses/balances`);

// Crear un nuevo gasto en un proyecto
export const createExpense = async (projectId, payload) => {
  const { data } = await api.post(`/projects/${projectId}/expenses`, payload);
  return data;
};

// Actualizar un gasto existente en un proyecto
export const updateExpenseById = async (projectId, expenseId, payload) => {
  const { data } = await api.put(`/projects/${projectId}/expenses/${expenseId}`, payload);
  return data;
};

// Eliminar un gasto de un proyecto
export const deleteExpenseById = async (projectId, expenseId) => {
  const { data } = await api.delete(`/projects/${projectId}/expenses/${expenseId}`);
  return data;
};

// Registra una liquidación de deuda creando un gasto especial
export const settleDebt = async (projectId, { from, to, amount, method }) => {
  const payload = {
    title: 'Liquidación de deuda',
    amount: Number(amount),
    paidBy: from,
    splitBetween: [{ user: to, share: Number(amount) }],
    isPersonal: false,
    isSettlement: true,
    paymentMethod: method || 'bizum',
    date: new Date().toISOString(),
  };

  const { data } = await api.post(`/projects/${projectId}/expenses`, payload);
  return data;
};

// Revertir / deshacer una liquidación equivale a eliminar dicho gasto
export const revertSettlement = async (projectId, settlementExpenseId) => {
  const { data } = await api.delete(`/projects/${projectId}/expenses/${settlementExpenseId}`);
  return data;
};