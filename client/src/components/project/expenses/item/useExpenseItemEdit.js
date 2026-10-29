import { useState } from 'react';
import { extractEntityId } from '../../../../utils/expenseHelpers';

export function useExpenseItemEdit({ expense, project, currentUser, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    category: 'General',
    date: '',
    isPersonal: false,
    paidBy: '',
  });

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMemberSplit = (memberId) => {
    setSelectedMembers((prev) => {
      const cleanId = extractEntityId(memberId);
      if (prev.includes(cleanId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== cleanId);
      }
      return [...prev, cleanId];
    });
  };

  const startEditing = () => {
    setIsConfirmingSave(false);
    setActionFeedback(null);

    const existingPayerId = extractEntityId(expense.paidBy);
    const currentId = extractEntityId(currentUser);

    const activeProjectMemberIds = (project?.members || [])
      .filter((m) => m?.status !== 'pending')
      .map((m) => extractEntityId(m?.user || m))
      .filter(Boolean);

    const currentSplitMembers = Array.isArray(expense.splitBetween) && expense.splitBetween.length > 0
      ? expense.splitBetween.map((s) => extractEntityId(s.user || s)).filter(Boolean)
      : activeProjectMemberIds;

    setSelectedMembers(currentSplitMembers);

    setEditForm({
      title: expense.title || '',
      amount: expense.amount !== undefined ? expense.amount : '',
      category: expense.category || 'General',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      isPersonal: Boolean(expense.isPersonal),
      paidBy: existingPayerId || currentId,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsConfirmingSave(false);
    setActionFeedback(null);
  };

  const saveExpense = async () => {
    setActionFeedback(null);
    const numericAmount = Number(editForm.amount);

    if (!editForm.title.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setActionFeedback({
        type: 'error',
        text: 'Debes indicar un concepto válido y un importe superior a 0.',
      });
      return;
    }

    const payerIdToSend = extractEntityId(editForm.paidBy);
    let updatedSplit = [];

    if (!editForm.isPersonal && selectedMembers.length > 0) {
      const totalCents = Math.round(numericAmount * 100);
      const baseCents = Math.floor(totalCents / selectedMembers.length);
      let remainderCents = totalCents % selectedMembers.length;

      updatedSplit = selectedMembers.map((memberId) => {
        const shareCents = baseCents + (remainderCents > 0 ? 1 : 0);
        if (remainderCents > 0) remainderCents -= 1;
        return {
          user: extractEntityId(memberId),
          share: Number((shareCents / 100).toFixed(2)),
        };
      });
    }

    setIsProcessing(true);
    try {
      await onUpdate(expense._id, {
        title: editForm.title.trim(),
        amount: Number(numericAmount.toFixed(2)),
        category: editForm.category,
        date: editForm.date ? new Date(editForm.date).toISOString() : new Date().toISOString(),
        isPersonal: Boolean(editForm.isPersonal),
        paidBy: payerIdToSend,
        splitBetween: editForm.isPersonal ? [] : updatedSplit,
      });

      setActionFeedback({ type: 'success', text: 'Gasto actualizado correctamente' });
      setIsConfirmingSave(false);
      setTimeout(() => {
        setIsEditing(false);
        setActionFeedback(null);
      }, 800);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al actualizar el gasto',
      });
      setIsConfirmingSave(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isEditing,
    editForm,
    selectedMembers,
    isProcessing,
    actionFeedback,
    isConfirmingSave,
    setIsConfirmingSave,
    handleFieldChange,
    toggleMemberSplit,
    startEditing,
    cancelEditing,
    saveExpense,
    setActionFeedback,
  };
}