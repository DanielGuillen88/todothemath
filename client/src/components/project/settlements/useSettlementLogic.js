import { useState } from 'react';
import { extractEntityId } from '../../../utils/expenseHelpers/index.js';

export function useSettlementLogic({
  project,
  balances,
  expenses = [],
  currentUser,
  settlementHistory = [],
  onSettle,
  onRevertSettle,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [confirmRevertId, setConfirmRevertId] = useState(null);
  const [expandedDebts, setExpandedDebts] = useState({});
  const [selectedTx, setSelectedTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bizum');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const currentUserId = String(
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    extractEntityId(currentUser) ||
    ''
  ).trim();

  const currentUserEmail = String(
    currentUser?.email || 
    currentUser?.user?.email || 
    ''
  ).toLowerCase().trim();

  const currentUserName = String(
    currentUser?.name || 
    currentUser?.user?.name || 
    ''
  ).toLowerCase().trim();

  const isMongoId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

  const resolveMemberId = (val, entityObj) => {
    const extractedFromObj = extractEntityId(entityObj?.user || entityObj);
    if (isMongoId(extractedFromObj)) return extractedFromObj;

    const extractedFromVal = extractEntityId(val?.user || val);
    if (isMongoId(extractedFromVal)) return extractedFromVal;

    if (isMongoId(val)) return String(val).trim();

    const searchStr = String(val?.name || val || '').toLowerCase().trim();
    if (searchStr) {
      if (currentUserId && (searchStr === currentUserName || searchStr === currentUserEmail)) {
        return currentUserId;
      }

      if (Array.isArray(project?.members)) {
        const found = project.members.find((m) => {
          const userObj = m?.user || m;
          const mId = extractEntityId(userObj);
          const mName = String(userObj?.name || '').toLowerCase().trim();
          const mEmail = String(userObj?.email || '').toLowerCase().trim();
          return mName === searchStr || mEmail === searchStr || mId === searchStr;
        });
        if (found) return extractEntityId(found?.user || found);
      }
    }

    return extractedFromObj || extractedFromVal || String(val || '');
  };

  const isMe = (entity, entityId) => {
    const userObj = entity?.user || entity;
    const idToTest = String(
      entityId || 
      extractEntityId(userObj) || 
      (typeof userObj === 'string' && !userObj.includes('@') ? userObj : userObj?._id || userObj?.id || '')
    ).trim();

    if (currentUserId && idToTest && currentUserId === idToTest) return true;

    const emailToTest = String(
      userObj?.email || 
      (typeof userObj === 'string' && userObj.includes('@') ? userObj : '')
    ).toLowerCase().trim();

    if (currentUserEmail && emailToTest && currentUserEmail === emailToTest) return true;

    const nameToTest = String(
      userObj?.name || 
      (typeof userObj === 'string' ? userObj : '')
    ).toLowerCase().trim();

    if (currentUserName && nameToTest && currentUserName === nameToTest) return true;

    return false;
  };

  const toggleDebtAccordion = (debtKey) => {
    setExpandedDebts((prev) => ({
      ...prev,
      [debtKey]: !prev[debtKey],
    }));
  };

  const getRelatedExpenses = (fromId, toId) => {
    if (!Array.isArray(expenses) || expenses.length === 0) return [];

    return expenses.filter((exp) => {
      if (exp.isPersonal || exp.isSettlement) return false;
      const payerId = extractEntityId(exp.paidBy);
      if (payerId !== toId) return false;

      if (Array.isArray(exp.splitBetween)) {
        return exp.splitBetween.some((s) => extractEntityId(s.user || s) === fromId);
      }
      return false;
    }).map((exp) => {
      const splitInfo = exp.splitBetween.find((s) => extractEntityId(s.user || s) === fromId);
      const computedShare = splitInfo?.share ?? (Number(exp.amount || 0) / (exp.splitBetween.length || 1));
      return {
        _id: exp._id,
        title: exp.title,
        date: exp.date || exp.createdAt,
        totalAmount: Number(exp.amount || 0),
        shareAmount: Number(computedShare || 0),
      };
    });
  };

  const allSettlements = Array.isArray(balances?.settlements)
    ? balances.settlements
    : Array.isArray(balances?.transactions)
    ? balances.transactions
    : [];

  const myPendingSettlements = allSettlements.filter((tx) => {
    const fId = resolveMemberId(tx.fromId || tx.from, tx.from);
    const tId = resolveMemberId(tx.toId || tx.to, tx.to);
    return isMe(tx.from, fId) || isMe(tx.to, tId);
  });

  const myHistory = settlementHistory.filter((st) => {
    const fId = resolveMemberId(st.fromId || st.from, st.from);
    const tId = resolveMemberId(st.toId || st.to, st.to);
    return isMe(st.from, fId) || isMe(st.to, tId);
  });

  const handleOpenSettleModal = (txData) => {
    const cleanFromId = resolveMemberId(txData.fromId || txData.from, txData.from);
    const cleanToId = resolveMemberId(txData.toId || txData.to, txData.to);

    const fromName = typeof txData.from === 'object'
      ? txData.from?.name || txData.from?.email || 'Participante'
      : txData.fromName || txData.from || 'Participante';

    const toName = typeof txData.to === 'object'
      ? txData.to?.name || txData.to?.email || 'Participante'
      : txData.toName || txData.to || 'Participante';

    setSelectedTx({
      ...txData,
      fromId: cleanFromId,
      toId: cleanToId,
      fromName,
      toName,
    });
    setPaymentMethod('bizum');
    setFeedback(null);
  };

  const handleConfirmSettle = async () => {
    if (!selectedTx || !onSettle) return;

    if (!isMongoId(selectedTx.fromId) || !isMongoId(selectedTx.toId)) {
      setFeedback({
        type: 'error',
        text: 'Error de identificación: no se pudo resolver el ID de uno de los participantes.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await onSettle({
        from: selectedTx.fromId,
        to: selectedTx.toId,
        amount: Number(selectedTx.amount || 0),
        method: paymentMethod,
      });

      setSelectedTx(null);
      setFeedback({ type: 'success', text: 'Pago registrado con éxito.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al liquidar la deuda.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async (settlementId) => {
    if (!onRevertSettle) return;
    setRevertingId(settlementId);

    try {
      await onRevertSettle(settlementId);
      setConfirmRevertId(null);
      setFeedback({ type: 'success', text: 'Liquidación deshecha. Vuelve a figurar en pendientes.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al revertir la liquidación.',
      });
      setConfirmRevertId(null);
    } finally {
      setRevertingId(null);
    }
  };

  return {
    activeTab,
    setActiveTab,
    myPendingSettlements,
    myHistory,
    feedback,
    confirmRevertId,
    setConfirmRevertId,
    revertingId,
    expandedDebts,
    toggleDebtAccordion,
    getRelatedExpenses,
    resolveMemberId,
    isMe,
    selectedTx,
    setSelectedTx,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    handleOpenSettleModal,
    handleConfirmSettle,
    handleRevert,
  };
}