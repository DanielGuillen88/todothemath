import { useState } from 'react';
import { CheckCircle2, AlertCircle, Check, X, Pencil, Trash2, Loader2 } from 'lucide-react';

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
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const [editForm, setEditForm] = useState({
    title: expense.title || '',
    amount: expense.amount !== undefined ? expense.amount : '',
    category: expense.category || 'General',
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
    isPersonal: Boolean(expense.isPersonal),
    paidBy: String(expense.paidBy?._id || expense.paidBy || currentUser?._id || ''),
  });

  const handleStartEditing = () => {
    setIsConfirmingDelete(false);
    setIsConfirmingSave(false);
    setActionFeedback(null);

    const rawPayer = expense.paidBy;
    const existingPayerId = typeof rawPayer === 'object'
      ? String(rawPayer?._id || rawPayer?.id || '')
      : String(rawPayer || '');

    const currentId = String(currentUser?._id || currentUser?.id || '');
    const resolvedPayerId = existingPayerId || currentId;

    setEditForm({
      title: expense.title || '',
      amount: expense.amount !== undefined ? expense.amount : '',
      category: expense.category || 'General',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      isPersonal: Boolean(expense.isPersonal),
      paidBy: resolvedPayerId,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setActionFeedback(null);

    if (!editForm.title.trim() || Number(editForm.amount) <= 0) {
      setActionFeedback({
        type: 'error',
        text: 'Debes indicar un concepto válido y un importe superior a 0.',
      });
      return;
    }

    const payerIdToSend = typeof editForm.paidBy === 'object'
      ? String(editForm.paidBy?._id || editForm.paidBy?.id || '')
      : String(editForm.paidBy || '');

    const sanitizedSplit = Array.isArray(expense.splitBetween)
      ? expense.splitBetween.map((item) => ({
          user: typeof item.user === 'object'
            ? String(item.user?._id || item.user?.id || '')
            : String(item.user || item),
          share: Number(item.share) || 0,
        }))
      : [];

    setIsProcessing(true);
    try {
      await onUpdate(expense._id, {
        title: editForm.title.trim(),
        amount: Number(editForm.amount),
        category: editForm.category,
        date: new Date(editForm.date).toISOString(),
        isPersonal: editForm.isPersonal,
        paidBy: payerIdToSend,
        splitBetween: editForm.isPersonal ? undefined : sanitizedSplit,
      });

      // Se activa el mensaje de éxito (esto oculta el formulario al instante)
      setActionFeedback({ type: 'success', text: 'Gasto actualizado correctamente' });
      setIsConfirmingSave(false);

      // Tras 900ms sale del modo edición y limpia el aviso
      setTimeout(() => {
        setIsEditing(false);
        setActionFeedback(null);
      }, 900);
    } catch (err) {
      // En error: se mantiene el formulario abierto y solo muestra el aviso arriba
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

  // 1. Si hay éxito (sea por borrado o tras guardar edición), desaparece el form y la fila
  //    y solo se ve el feedback positivo en ese espacio.
  if (actionFeedback?.type === 'success') {
    return (
      <div className="py-3 px-4 my-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-pulse">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>{actionFeedback.text}</span>
      </div>
    );
  }

  const myShare = getMyShareForExpense(expense);
  const paidByMe = isMe(expense.paidBy);
  const payerName = paidByMe ? 'Mí' : (expense.paidBy?.name || 'Otro miembro');

  // 2. Modo Edición Inline (siempre que no esté en estado success)
  if (isEditing) {
    return (
      <div className="p-3.5 my-1.5 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3">
        {/* Solo renderiza mensaje de error; los positivos ya reemplazaron el componente arriba */}
        {actionFeedback?.type === 'error' && (
          <div className="p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium bg-red-950/40 border border-red-800/80 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionFeedback.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            disabled={isProcessing}
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            placeholder="Concepto"
            className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <input
            type="number"
            step="any"
            min="0.01"
            disabled={isProcessing}
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            placeholder="Importe"
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <input
            type="date"
            disabled={isProcessing}
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <select
            disabled={isProcessing}
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="Otros">Otros</option>
            <option value="Ocio">Ocio</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Alojamiento">Alojamiento</option>
            <option value="Supermercado">Supermercado</option>
            <option value="Personales">Personales</option>
          </select>

          <select
            disabled={isProcessing}
            value={String(editForm.paidBy || '')}
            onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {project?.members?.map((m, mIdx) => {
              const memberId = String(m?._id || m?.id || (typeof m === 'string' ? m : ''));
              const isCurrent = memberId === String(currentUser?._id || currentUser?.id);
              const memberName = m?.name || (memberId ? `Miembro (${memberId.slice(-4)})` : `Miembro ${mIdx + 1}`);

              return (
                <option key={memberId || `mem-${mIdx}`} value={memberId}>
                  Pagado por: {memberName} {isCurrent ? '(Tú)' : ''}
                </option>
              );
            })}
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              disabled={isProcessing}
              checked={editForm.isPersonal}
              onChange={(e) => setEditForm({ ...editForm, isPersonal: e.target.checked })}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Gasto Personal</span>
          </label>
        </div>

        <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-800">
          {isConfirmingSave ? (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/60 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-indigo-200 font-medium mr-1">¿Guardar cambios?</span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSave}
                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsConfirmingSave(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setIsEditing(false);
                  setActionFeedback(null);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsConfirmingSave(true)}
                className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Guardar
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. Vista estándar de la tarjeta de gasto
  const cardTypeStyles = expense.isPersonal
    ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-900/40 border-l-4 border-l-amber-500'
    : 'bg-indigo-950/20 hover:bg-indigo-950/30 border-indigo-900/40 border-l-4 border-l-indigo-500';

  return (
    <div
      className={`py-3.5 px-3.5 my-1.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group ${cardTypeStyles} ${
        isConfirmingDelete ? '!bg-red-950/30 !border-red-900/70 !border-l-red-500' : ''
      }`}
    >
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
          <span>
            a las{' '}
            <span className="text-slate-200 font-medium">
              {new Date(expense.createdAt || expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
          {!expense.isPersonal && expense.splitBetween?.length > 0 && (
            <span className="text-indigo-300/80 font-medium">
              (➗ {expense.splitBetween.length})
            </span>
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
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDelete}
              className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsConfirmingDelete(false)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleStartEditing}
              title="Editar gasto"
              className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              title="Eliminar gasto"
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="text-right flex flex-col items-end min-w-[85px]">
          {!expense.isPersonal && (
            <div className="flex items-center gap-1 text-xs mt-0.5">
              <span className="font-semibold text-emerald-400">
                {myShare.toFixed(2)} {project?.currency || '€'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${expense.isPersonal ? 'text-emerald-400' : 'text-white'}`}>
              {Number(expense.amount || 0).toFixed(2)} {project?.currency || '€'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}