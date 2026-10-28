import { useState } from 'react';
import { CheckCircle2, AlertCircle, Check, X, Pencil, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import ExpenseFields from './ExpenseFields';
import { Button } from '../ui';
import {
  extractEntityId,
  formatTimeHHMM,
} from '../../utils/expenseHelpers';

export default function ExpenseItem({
  expense,
  project,
  currentUser,
  isMe,
  getMyShareForExpense,
  onUpdate,
  onDelete,
  groupBy,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Estado del acordeón inline de desglose
  const [isSplitExpanded, setIsSplitExpanded] = useState(false);

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    category: 'General',
    date: '',
    isPersonal: false,
    paidBy: '',
  });

  const currency = project?.currency || '€';
  const totalAmount = Number(expense?.amount || 0);

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

  const handleStartEditing = () => {
    setIsConfirmingDelete(false);
    setIsConfirmingSave(false);
    setActionFeedback(null);
    setIsSplitExpanded(false);

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

  const handleSave = async () => {
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

  const handleDelete = async () => {
    setActionFeedback(null);
    setIsProcessing(true);

    try {
      setActionFeedback({ type: 'success', text: 'Eliminando gasto...' });
      await onDelete(expense._id);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al eliminar el gasto',
      });
      setIsConfirmingDelete(false);
      setIsProcessing(false);
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  if (actionFeedback?.type === 'success' && !isEditing) {
    return (
      <div className="py-3 px-4 my-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-pulse">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>{actionFeedback.text}</span>
      </div>
    );
  }

  const payerId = extractEntityId(expense.paidBy);
  const paidByMe = isMe ? isMe(expense.paidBy, payerId) : false;
  const payerName = paidByMe ? 'Mí' : (expense.paidBy?.name || 'Otro miembro');

  let computedShare = 0;
  if (!expense.isPersonal) {
    if (typeof getMyShareForExpense === 'function') {
      computedShare = getMyShareForExpense(expense);
    }
    
    if (computedShare === 0 && Array.isArray(expense.splitBetween) && expense.splitBetween.length > 0) {
      const currentUserId = extractEntityId(currentUser);
      const mySplit = expense.splitBetween.find((s) => {
        const splitUserId = extractEntityId(s.user || s);
        return splitUserId && currentUserId && splitUserId === currentUserId;
      });
      if (mySplit) {
        computedShare = Number(mySplit.share || 0);
      }
    }
  }

  if (isEditing) {
    return (
      <div className="p-3.5 my-1.5 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3">
        {actionFeedback?.type === 'error' && (
          <div className="p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium bg-red-950/40 border border-red-800/80 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionFeedback.text}</span>
          </div>
        )}

        <ExpenseFields
          values={editForm}
          onChange={handleFieldChange}
          project={project}
          currentUser={currentUser}
          disabled={isProcessing}
          showSplitSelector={!editForm.isPersonal}
          selectedMembers={selectedMembers}
          onToggleMember={toggleMemberSplit}
        />

        <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
          {isConfirmingSave ? (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/60 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-indigo-200 font-medium mr-1">¿Guardar cambios?</span>
              <Button
                size="sm"
                variant="primary"
                isLoading={isProcessing}
                icon={Check}
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                icon={X}
                onClick={() => setIsConfirmingSave(false)}
              />
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                icon={X}
                onClick={() => {
                  setIsEditing(false);
                  setActionFeedback(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={isProcessing}
                icon={Check}
                onClick={() => setIsConfirmingSave(true)}
              >
                Guardar
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const cardTypeStyles = expense.isPersonal
    ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-900/40 border-l-4 border-l-amber-500'
    : 'bg-indigo-950/20 hover:bg-indigo-950/30 border-indigo-900/40 border-l-4 border-l-indigo-500';

  return (
    <div
      className={`py-3.5 px-3.5 my-1.5 rounded-xl border flex flex-col transition-all group ${cardTypeStyles} ${
        isConfirmingDelete ? '!bg-red-950/30 !border-red-900/70 !border-l-red-500' : ''
      }`}
    >
      {/* Fila principal del gasto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-semibold text-white truncate">{expense.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1">
            {groupBy !== 'category' && groupBy !== 'both' && (
              <>
                <span className="text-slate-300 font-medium">{expense.category || 'General'}</span>
                <span>•</span>
              </>
            )}
            <span>
              💰 por <span className="text-slate-200 font-medium">{payerName}</span>
            </span>

            {groupBy !== 'date' && groupBy !== 'both' && (
              <span>
                el <span className="text-slate-200 font-medium">
                  {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                </span>
              </span>
            )}

            <span>
              a las <span className="text-slate-200 font-medium">{formatTimeHHMM(expense.createdAt || expense.date)}</span>
            </span>

            {/* Botón interactivo para alternar el acordeón */}
            {!expense.isPersonal && expense.splitBetween?.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSplitExpanded((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-[11px] transition-all cursor-pointer ${
                  isSplitExpanded
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-indigo-950/80 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/80 hover:text-indigo-200'
                }`}
                title={isSplitExpanded ? 'Ocultar participantes' : 'Ver participantes de este gasto'}
              >
                <span>➗ {expense.splitBetween.length}</span>
                {isSplitExpanded ? (
                  <ChevronUp className="w-3 h-3 text-indigo-200" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-indigo-300" />
                )}
              </button>
            )}
          </div>

          {actionFeedback?.type === 'error' && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionFeedback.text}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-slate-950/90 border border-red-900/60 px-2.5 py-1.5 rounded-lg shadow-inner">
              <span className="text-xs text-red-300 font-medium mr-1">¿Eliminar?</span>
              <Button
                size="sm"
                variant="danger"
                isLoading={isProcessing}
                icon={Check}
                onClick={handleDelete}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                icon={X}
                onClick={() => setIsConfirmingDelete(false)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={Pencil}
                title="Editar gasto"
                onClick={handleStartEditing}
                className="px-1.5 py-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-900/60"
              />
              <Button
                size="sm"
                variant="ghost"
                icon={Trash2}
                title="Eliminar gasto"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-1.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900/60"
              />
            </div>
          )}

          {/* Zona de importe */}
          <div className="text-right flex flex-col items-end justify-center min-w-[75px]">
            {expense.isPersonal ? (
              <span className="text-sm font-bold text-amber-400">
                {totalAmount.toFixed(2)} {currency}
              </span>
            ) : (
              <>
                <span className="text-sm font-bold text-emerald-400">
                  {computedShare.toFixed(2)} {currency}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {totalAmount.toFixed(2)} {currency}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Acordeón Inline: Desglose de participantes */}
      {isSplitExpanded && !expense.isPersonal && expense.splitBetween?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reparto entre participantes ({expense.splitBetween.length}):</span>
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              Total: {totalAmount.toFixed(2)} {currency}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
            {expense.splitBetween.map((splitItem, idx) => {
              const memberId = extractEntityId(splitItem.user || splitItem);
              const memberIsCurrent = isMe ? isMe(splitItem.user, memberId) : false;

              let memberName = splitItem.user?.name || splitItem.user?.email;
              if (!memberName && project?.members) {
                const found = project.members.find((m) => {
                  const u = m?.user || m;
                  return extractEntityId(u) === memberId;
                });
                const foundUser = found?.user || found;
                if (foundUser) memberName = foundUser.name || foundUser.email;
              }
              if (!memberName) memberName = `Usuario (${memberId.slice(-4)})`;

              const itemShare = Number(
                splitItem.share ?? (totalAmount / (expense.splitBetween.length || 1))
              );

              return (
                <div
                  key={`split-detail-${memberId}-${idx}`}
                  className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                    memberIsCurrent
                      ? 'bg-indigo-950/80 border border-indigo-700/60'
                      : 'bg-slate-950/60 border border-slate-800/60'
                  }`}
                >
                  <span className={`truncate mr-2 ${memberIsCurrent ? 'font-semibold text-indigo-300' : 'text-slate-300'}`}>
                    {memberIsCurrent ? 'Tú' : memberName}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-emerald-400 shrink-0">
                    {itemShare.toFixed(2)} {currency}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}