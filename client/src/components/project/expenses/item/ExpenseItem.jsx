import { useState } from 'react';
import { CheckCircle2, AlertCircle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../ui';
import ExpenseItemEditForm from './ExpenseItemEditForm';
import ExpenseItemSplitGrid from './ExpenseItemSplitGrid';
import ExpenseItemDeleteConfirm from './ExpenseItemDeleteConfirm';
import { useExpenseItemEdit } from './useExpenseItemEdit';
import { extractEntityId, formatTimeHHMM } from '../../../../utils/expenseHelpers';

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(null);
  const [isSplitExpanded, setIsSplitExpanded] = useState(false);

  const editState = useExpenseItemEdit({ expense, project, currentUser, onUpdate });

  const currency = project?.currency || '€';
  const totalAmount = Number(expense?.amount || 0);
  const payerId = extractEntityId(expense?.paidBy);
  const paidByMe = isMe ? isMe(expense?.paidBy, payerId) : false;
  const payerName = paidByMe ? 'Mí' : (expense?.paidBy?.name || 'Otro miembro');

  // Cálculo de cuota personal
  let computedShare = 0;
  if (!expense?.isPersonal) {
    if (typeof getMyShareForExpense === 'function') {
      computedShare = getMyShareForExpense(expense);
    }
    if (computedShare === 0 && Array.isArray(expense?.splitBetween) && expense.splitBetween.length > 0) {
      const currentUserId = extractEntityId(currentUser);
      const mySplit = expense.splitBetween.find((s) => extractEntityId(s.user || s) === currentUserId);
      if (mySplit) computedShare = Number(mySplit.share || 0);
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(expense._id);
    } catch (err) {
      setDeleteFeedback(err.response?.data?.message || 'Error al eliminar el gasto');
      setIsConfirmingDelete(false);
      setIsDeleting(false);
      setTimeout(() => setDeleteFeedback(null), 3500);
    }
  };

  if (editState.actionFeedback?.type === 'success' && !editState.isEditing) {
    return (
      <div className="py-3 px-4 my-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-pulse">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>{editState.actionFeedback.text}</span>
      </div>
    );
  }

  if (editState.isEditing) {
    return (
      <ExpenseItemEditForm
        editForm={editState.editForm}
        onFieldChange={editState.handleFieldChange}
        project={project}
        currentUser={currentUser}
        isProcessing={editState.isProcessing}
        selectedMembers={editState.selectedMembers}
        onToggleMember={editState.toggleMemberSplit}
        actionFeedback={editState.actionFeedback}
        isConfirmingSave={editState.isConfirmingSave}
        onStartConfirmSave={() => editState.setIsConfirmingSave(true)}
        onCancelConfirmSave={() => editState.setIsConfirmingSave(false)}
        onSave={editState.saveExpense}
        onCancelEditing={editState.cancelEditing}
      />
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
                el <span className="text-slate-200 font-medium">{new Date(expense.date || expense.createdAt).toLocaleDateString()}</span>
              </span>
            )}
            <span>
              a las <span className="text-slate-200 font-medium">{formatTimeHHMM(expense.createdAt || expense.date)}</span>
            </span>

            {!expense.isPersonal && expense.splitBetween?.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSplitExpanded((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-[11px] transition-all cursor-pointer ${
                  isSplitExpanded
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-indigo-950/80 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/80 hover:text-indigo-200'
                }`}
                title={isSplitExpanded ? 'Ocultar participantes' : 'Ver participantes'}
              >
                <span>➗ {expense.splitBetween.length}</span>
                {isSplitExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {deleteFeedback && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{deleteFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {isConfirmingDelete ? (
            <ExpenseItemDeleteConfirm
              isProcessing={isDeleting}
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmingDelete(false)}
            />
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={Pencil}
                title="Editar gasto"
                onClick={editState.startEditing}
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

          <div className="text-right flex flex-col items-end justify-center min-w-[75px]">
            {expense.isPersonal ? (
              <span className="text-sm font-bold text-amber-400">{totalAmount.toFixed(2)} {currency}</span>
            ) : (
              <>
                <span className="text-sm font-bold text-emerald-400">{computedShare.toFixed(2)} {currency}</span>
                <span className="text-[11px] font-medium text-slate-400">{totalAmount.toFixed(2)} {currency}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isSplitExpanded && !expense.isPersonal && (
        <ExpenseItemSplitGrid
          splitBetween={expense.splitBetween}
          totalAmount={totalAmount}
          currency={currency}
          project={project}
          isMe={isMe}
        />
      )}
    </div>
  );
}