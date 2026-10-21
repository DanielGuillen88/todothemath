import { useState, useCallback, useMemo, useEffect } from 'react';
import { getProjectById, addMemberToProject, removeMemberFromProject } from '../services/projectService';
import { getProjectExpenses, getProjectBalances, createExpense, updateExpenseById,  deleteExpenseById } from '../services/expenseService';

export function useProjectDetails(projectId, user) {
  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = String(user?._id || user?.id || user?.user?._id || user?.user?.id || '');
  const currentUserEmail = (user?.email || user?.user?.email || '').toLowerCase().trim();

  const isMe = useCallback(
    (target) => {
      if (!target) return false;
      if (typeof target === 'string') {
        return target === currentUserId || (currentUserEmail && target.toLowerCase() === currentUserEmail);
      }
      const targetId = String(target._id || target.id || '');
      const targetEmail = (target.email || '').toLowerCase().trim();
      return (currentUserId && targetId === currentUserId) || (currentUserEmail && targetEmail === currentUserEmail);
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
          const extracted = pData?.data?.project || pData?.project || pData?.data || pData;
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
          const list = eData?.data?.expenses || eData?.expenses || eData?.data || (Array.isArray(eData) ? eData : []);
          setExpenses(Array.isArray(list) ? list : []);
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

  const getMyShareForExpense = useCallback(
    (exp) => {
      const rawAmount = Number(exp?.amount || 0);
      if (!rawAmount || rawAmount <= 0) return 0;

      if (exp.isPersonal) {
        return isMe(exp.paidBy) ? rawAmount : 0;
      }

      if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
        const mySplitItem = exp.splitBetween.find((item) => isMe(item.user) || isMe(item));
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

  return {
    project, expenses, balances, loading, metrics,
    isMe, getMyShareForExpense, addExpense, updateExpense, deleteExpense, addMember, removeMember
  };
}