import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  getProjectById,
  addMemberToProject,
  removeMemberFromProject,
} from '../services/projectService';
import {
  getProjectExpenses,
  getProjectBalances,
  createExpense,
  updateExpenseById,
  deleteExpenseById,
  settleDebt as settleDebtService,
  revertSettlement as revertSettlementService,
} from '../services/expenseService';

export function useProjectDetails(projectId, user) {
  const [project, setProject] = useState(null);
  const [allExpenses, setAllExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = String(
    user?._id || user?.id || user?.user?._id || user?.user?.id || ''
  );
  const currentUserEmail = (
    user?.email || user?.user?.email || ''
  ).toLowerCase().trim();

  const isMe = useCallback(
    (target) => {
      if (!target) return false;
      if (typeof target === 'string') {
        return (
          target === currentUserId ||
          (currentUserEmail && target.toLowerCase() === currentUserEmail)
        );
      }
      const targetId = String(target._id || target.id || '');
      const targetEmail = (target.email || '').toLowerCase().trim();
      return (
        (currentUserId && targetId === currentUserId) ||
        (currentUserEmail && targetEmail === currentUserEmail)
      );
    },
    [currentUserId, currentUserEmail]
  );

  const loadProjectData = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        const [projectRes, balancesRes, expensesRes] = await Promise.allSettled([
          getProjectById(projectId),
          getProjectBalances(projectId),
          getProjectExpenses(projectId),
        ]);

        if (projectRes.status === 'fulfilled') {
          const pData = projectRes.value.data;
          const extracted =
            pData?.data?.project || pData?.project || pData?.data || pData;
          if (extracted && (extracted._id || extracted.title || extracted.name)) {
            setProject(extracted);
          }
        }

        if (balancesRes.status === 'fulfilled') {
          const bData = balancesRes.value.data;
          setBalances(bData?.data || bData);
        }

        if (expensesRes.status === 'fulfilled') {
          const eData = expensesRes.value.data;
          const list =
            eData?.data?.expenses ||
            eData?.expenses ||
            eData?.data ||
            (Array.isArray(eData) ? eData : []);
          setAllExpenses(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Error cargando el proyecto:', err);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // 1. Gastos ordinarios
  // const expenses = useMemo(() => {
  //   return allExpenses.filter(
  //     (exp) => !exp.isSettlement && exp.title !== 'Liquidación de deuda'
  //   );
  // }, [allExpenses]);
  // 1. Gastos ordinarios con filtro estricto de privacidad
  const expenses = useMemo(() => {
    return allExpenses.filter((exp) => {
      // Excluir reembolsos y liquidaciones del feed de gastos
      if (exp.isSettlement || exp.title === 'Liquidación de deuda') {
        return false;
      }

      const isPayer = isMe(exp.paidBy);

      // Si es un gasto personal, SOLO lo ve quien lo pagó
      if (exp.isPersonal) {
        return isPayer;
      }

      // Si es compartido y lo pagó el usuario actual, siempre lo ve
      if (isPayer) {
        return true;
      }

      // Si es compartido y lo pagó otro, verificar si el usuario actual está en splitBetween
      if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
        return exp.splitBetween.some((item) => isMe(item.user || item));
      }

      // Reparto equitativo por defecto a todos los miembros del proyecto
      return true;
    });
  }, [allExpenses, isMe]);

  // 2. Historial de liquidaciones
  const settlementHistory = useMemo(() => {
    return allExpenses
      .filter(
        (exp) => Boolean(exp.isSettlement) || exp.title === 'Liquidación de deuda'
      )
      .map((exp) => {
        const fromEntity = exp.paidBy;
        const firstSplit = Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0
          ? exp.splitBetween[0]
          : null;
        const toEntity = firstSplit?.user || firstSplit;

        return {
          _id: exp._id || exp.id,
          from: fromEntity,
          fromId: String(fromEntity?._id || fromEntity?.id || fromEntity || ''),
          to: toEntity,
          toId: String(toEntity?._id || toEntity?.id || toEntity || ''),
          amount: exp.amount,
          method: exp.paymentMethod || 'bizum',
          date: exp.date || exp.createdAt,
        };
      });
  }, [allExpenses]);

  // console.log('TODOS LOS GASTOS:', allExpenses);
  // console.log('HISTORIAL FILTRADO:', settlementHistory);
  // console.log('DETALLE GASTO LIQUIDACION:', allExpenses[0]);

  const getMyShareForExpense = useCallback(
    (exp) => {
      const rawAmount = Number(exp?.amount || 0);
      if (!rawAmount || rawAmount <= 0) return 0;

      if (exp.isPersonal) {
        return isMe(exp.paidBy) ? rawAmount : 0;
      }

      if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
        const mySplitItem = exp.splitBetween.find(
          (item) => isMe(item.user) || isMe(item)
        );
        if (mySplitItem) {
          return Number(mySplitItem.share ?? rawAmount / exp.splitBetween.length);
        }
        return 0;
      }

      const totalMembers = project?.members?.length || 1;
      return Number((rawAmount / totalMembers).toFixed(2));
    },
    [isMe, project?.members]
  );

  const metrics = useMemo(() => {
    let myRealShareTotal = 0;
    let totalProjectShared = 0;
    let myPersonalOnlyTotal = 0;

    expenses.forEach((exp) => {
      const rawAmount = Number(exp.amount || 0);
      const isPaidByMe = isMe(exp.paidBy);

      if (exp.isPersonal) {
        if (isPaidByMe) {
          myRealShareTotal += rawAmount;
          myPersonalOnlyTotal += rawAmount;
        }
      } else {
        totalProjectShared += rawAmount;
        myRealShareTotal += getMyShareForExpense(exp);
      }
    });

    return {
      myRealTotal: myRealShareTotal,
      totalShared: totalProjectShared,
      myPersonal: myPersonalOnlyTotal,
    };
  }, [expenses, isMe, getMyShareForExpense]);

  const addExpense = async (payload) => {
    await createExpense(projectId, payload);
    await loadProjectData(true);
  };

  const updateExpense = async (expenseId, payload) => {
    await updateExpenseById(projectId, expenseId, payload);
    await loadProjectData(true);
  };

  const deleteExpense = async (expenseId) => {
    await deleteExpenseById(projectId, expenseId);
    await loadProjectData(true);
  };

  const addMember = async (email) => {
    const data = await addMemberToProject(projectId, email);
    await loadProjectData(true);
    return data;
  };

  const removeMember = async (memberId) => {
    const data = await removeMemberFromProject(projectId, memberId);
    await loadProjectData(true);
    return data;
  };

  const settle = async (settleData) => {
    const data = await settleDebtService(projectId, settleData);
    await loadProjectData(true);
    return data;
  };

  const revertSettle = async (settlementId) => {
    const data = await revertSettlementService(projectId, settlementId);
    await loadProjectData(true);
    return data;
  };

  return {
    project,
    expenses,
    settlementHistory,
    balances,
    loading,
    metrics,
    isMe,
    getMyShareForExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    addMember,
    removeMember,
    settle,
    revertSettle,
  };
}