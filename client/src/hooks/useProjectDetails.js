import { useState, useEffect, useCallback, useMemo } from 'react';

// Servicios de Proyectos
import { 
  getProjectById, 
  addMemberToProject, 
  removeMemberFromProject 
} from '../services/projectService';

// Servicios de Gastos
import { 
  getProjectExpenses, 
  getProjectBalances, 
  createExpense, 
  updateExpenseById, 
  deleteExpenseById 
} from '../services/expenseService';

// Servicios de Liquidaciones (Colección Settlement)
import { 
  createSettlement, 
  getProjectSettlements, 
  deleteSettlement 
} from '../services/settlementService';

import { extractEntityId } from '../utils/expenseHelpers/index.js';

export function useProjectDetails(projectId, currentUser) {
  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({ balances: [], settlements: [] });
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Extracción robusta y normalizada del usuario actual
  const currentUserId = String(
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    currentUser?.data?.user?._id ||
    currentUser?.data?.user?.id ||
    extractEntityId(currentUser) ||
    ''
  ).trim();

  const currentUserEmail = String(
    currentUser?.email ||
    currentUser?.user?.email ||
    currentUser?.data?.user?.email ||
    ''
  ).toLowerCase().trim();

  const currentUserName = String(
    currentUser?.name ||
    currentUser?.user?.name ||
    currentUser?.data?.user?.name ||
    ''
  ).toLowerCase().trim();

  // 2. Función de identidad canónica (compara ID, Email y Nombre)
  const isMe = useCallback((entity, optionalId) => {
    const idToTest = String(
      optionalId || 
      extractEntityId(entity) || 
      (typeof entity === 'string' && !entity.includes('@') ? entity : entity?._id || entity?.id || '')
    ).trim();

    if (currentUserId && idToTest && currentUserId === idToTest) {
      return true;
    }

    const emailToTest = String(
      entity?.email || 
      (typeof entity === 'string' && entity.includes('@') ? entity : '')
    ).toLowerCase().trim();

    if (currentUserEmail && emailToTest && currentUserEmail === emailToTest) {
      return true;
    }

    const nameToTest = String(
      entity?.name || 
      (typeof entity === 'string' ? entity : '')
    ).toLowerCase().trim();

    if (currentUserName && nameToTest && currentUserName === nameToTest) {
      return true;
    }

    return false;
  }, [currentUserId, currentUserEmail, currentUserName]);

  // 3. Carga general de datos concurrentes
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, expRes, balancesRes, settlementsRes] = await Promise.all([
        getProjectById(projectId),
        getProjectExpenses(projectId),
        getProjectBalances(projectId),
        getProjectSettlements(projectId),
      ]);

      const projData = projRes.data?.data?.project || projRes.data?.project || projRes.data;
      setProject(projData);

      const rawExpenses = 
        expRes.data?.data?.expenses || 
        expRes.data?.expenses || 
        expRes.data?.data || 
        (Array.isArray(expRes.data) ? expRes.data : []);

      setExpenses(Array.isArray(rawExpenses) ? rawExpenses : []);

      setBalances(balancesRes.data?.data || balancesRes.data || { balances: [], settlements: [] });

      const rawSettlements = 
        settlementsRes.data?.data?.settlements || 
        settlementsRes.data?.settlements || 
        settlementsRes.data?.data || 
        (Array.isArray(settlementsRes.data) ? settlementsRes.data : []);

      setSettlementHistory(Array.isArray(rawSettlements) ? rawSettlements : []);
    } catch (err) {
      console.error('Error cargando detalles del proyecto:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Refresco exclusivo de balances y liquidaciones
  const refreshFinances = useCallback(async () => {
    if (!projectId) return;
    try {
      const [balancesRes, settlementsRes] = await Promise.all([
        getProjectBalances(projectId),
        getProjectSettlements(projectId),
      ]);

      setBalances(balancesRes.data?.data || balancesRes.data || { balances: [], settlements: [] });

      const rawSettlements = 
        settlementsRes.data?.data?.settlements || 
        settlementsRes.data?.settlements || 
        settlementsRes.data?.data || 
        (Array.isArray(settlementsRes.data) ? settlementsRes.data : []);

      setSettlementHistory(Array.isArray(rawSettlements) ? rawSettlements : []);
    } catch (err) {
      console.error('Error actualizando finanzas:', err);
    }
  }, [projectId]);

  // 5. Cuota individual de un gasto (evita errores con cuota 0 y calcula reparto equitativo si falta)
  const getMyShareForExpense = useCallback((exp) => {
    if (!exp) return 0;
    
    // Si es personal, solo cuenta como cuota si lo pagaste tú
    if (exp.isPersonal) {
      return isMe(exp.paidBy) ? Number(exp.amount || 0) : 0;
    }

    // Reparto manual registrado en splitBetween
    if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
      const mySplit = exp.splitBetween.find((s) => isMe(s.user, extractEntityId(s.user || s)));
      if (mySplit) {
        return mySplit.share !== undefined && mySplit.share !== null && !isNaN(Number(mySplit.share))
          ? Number(mySplit.share)
          : Number((Number(exp.amount || 0) / exp.splitBetween.length).toFixed(2));
      }
    }
    return 0;
  }, [isMe]);

  // 6. Métricas financieras exactas para ProjectHeader
  const metrics = useMemo(() => {
    let totalSpent = 0;       // Compras comunes del proyecto
    let myTotalPaid = 0;      // Pagado de mi bolsillo en comunes
    let myTotalShare = 0;     // Mi parte consumida en comunes
    let myPersonal = 0;       // Mis gastos personales exclusivos

    expenses.forEach((exp) => {
      if (!exp || exp.isSettlement) return;
      const amt = Number(exp.amount || 0);

      // Gastos personales
      if (exp.isPersonal) {
        if (isMe(exp.paidBy)) {
          myPersonal += amt;
        }
        return;
      }

      // Gastos compartidos grupales
      totalSpent += amt;

      if (isMe(exp.paidBy)) {
        myTotalPaid += amt;
      }
      myTotalShare += getMyShareForExpense(exp);
    });

    // Liquidaciones pagadas y recibidas (Settlement)
    let mySettledPaid = 0;
    let mySettledReceived = 0;

    settlementHistory.forEach((st) => {
      const amt = Number(st.amount || 0);
      const fId = extractEntityId(st.from) || st.fromId || st.from;
      const tId = extractEntityId(st.to) || st.toId || st.to;

      if (isMe(st.from, fId)) mySettledPaid += amt;
      if (isMe(st.to, tId)) mySettledReceived += amt;
    });

    // Balances y costes finales
    const effectivePaid = myTotalPaid + mySettledPaid;
    const effectiveConsumed = myTotalShare + mySettledReceived;
    const myNetBalance = Number((effectivePaid - effectiveConsumed).toFixed(2));
    const myRealTotal = Number((myPersonal + myTotalShare).toFixed(2));

    // Presupuesto restante: Presupuesto fijado menos TU coste real (personales + tu cuota compartida)
    const projectBudget = Number(project?.budget || 0);
    const budgetRemaining = projectBudget > 0 
      ? Number((projectBudget - myRealTotal).toFixed(2)) 
      : null;

    return {
      totalSpent: Number(totalSpent.toFixed(2)),
      myTotalPaid: Number(myTotalPaid.toFixed(2)),
      myTotalShare: Number(myTotalShare.toFixed(2)),
      myPersonal: Number(myPersonal.toFixed(2)),
      myRealTotal,
      myNetBalance,
      budgetRemaining,
    };
  }, [expenses, settlementHistory, project?.budget, isMe, getMyShareForExpense]);

  // 7. Acciones sobre Gastos
  const addExpense = async (expenseData) => {
    await createExpense(projectId, expenseData);
    await fetchData();
  };

  const updateExpense = async (expenseId, expenseData) => {
    await updateExpenseById(projectId, expenseId, expenseData);
    await fetchData();
  };

  const deleteExpense = async (expenseId) => {
    await deleteExpenseById(projectId, expenseId);
    await fetchData();
  };

  // 8. Acciones sobre Miembros
  const addMember = async (email) => {
    await addMemberToProject(projectId, email);
    await fetchData();
  };

  const removeMember = async (userId) => {
    await removeMemberFromProject(projectId, userId);
    await fetchData();
  };

  // 9. Acciones sobre Liquidaciones
  const handleSettle = async ({ from, to, amount, method }) => {
    await createSettlement(projectId, { from, to, amount, method });
    await refreshFinances();
  };

  const handleRevertSettle = async (settlementId) => {
    await deleteSettlement(projectId, settlementId);
    await refreshFinances();
  };

  return {
    project,
    expenses,
    balances,
    settlementHistory,
    loading,
    metrics,
    isMe,
    getMyShareForExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    addMember,
    removeMember,
    handleSettle,
    handleRevertSettle,
    refreshFinances,
  };
}