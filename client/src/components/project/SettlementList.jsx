import { useState } from 'react';
import { CheckCircle2, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { extractEntityId } from '../../utils/expenseHelpers/index.js';

export default function SettlementList({
  balances,
  currency = '€',
  currentUser,
  onSettle,
}) {
  const settlements = balances?.settlements || balances?.transactions || [];
  const currentUserId = extractEntityId(currentUser);

  const [processingIdx, setProcessingIdx] = useState(null);
  const [feedback, setFeedback] = useState(null); // { idx, type: 'success' | 'error', text: '' }

  const handleSettle = async (tx, idx) => {
    if (!onSettle) return;
    setProcessingIdx(idx);
    setFeedback(null);

    try {
      await onSettle({
        from: extractEntityId(tx.from),
        to: extractEntityId(tx.to),
        amount: Number(tx.amount || 0),
      });

      setFeedback({ idx, type: 'success', text: 'Liquidación registrada' });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedback({
        idx,
        type: 'error',
        text: err.response?.data?.message || 'Error al liquidar la deuda',
      });
    } finally {
      setProcessingIdx(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span>Liquidación Óptima</span>
      </h2>
      <p className="text-xs text-slate-400 mb-6">
        Transacciones calculadas para deudas compartidas (los gastos personales se excluyen automáticamente).
      </p>

      {settlements.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-slate-400 text-sm">
          No hay deudas pendientes entre los participantes.
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((tx, idx) => {
            const fromId = extractEntityId(tx.from);
            const toId = extractEntityId(tx.to);

            const isDebtor = currentUserId && fromId === currentUserId;
            const isCreditor = currentUserId && toId === currentUserId;

            const fromName = typeof tx.from === 'object'
              ? (tx.from?.name || tx.from?.email || 'Participante')
              : tx.from;
            const toName = typeof tx.to === 'object'
              ? (tx.to?.name || tx.to?.email || 'Participante')
              : tx.to;

            const isCurrentItemFeedback = feedback?.idx === idx;

            return (
              <div
                key={tx._id || `settle-${fromId}-${toId}-${idx}`}
                className={`p-3.5 bg-slate-950 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-colors ${
                  isDebtor
                    ? 'border-red-900/40 bg-red-950/10'
                    : isCreditor
                    ? 'border-emerald-900/40 bg-emerald-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium flex-wrap">
                  <span className={isDebtor ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                    {fromName} {isDebtor ? '(Tú)' : ''}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className={isCreditor ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                    {toName} {isCreditor ? '(Tú)' : ''}
                  </span>

                  {isDebtor && (
                    <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded-full border border-red-800/60">
                      Debes pagar
                    </span>
                  )}
                  {isCreditor && (
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      Te deben
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {isCurrentItemFeedback && (
                    <div
                      className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                          : 'bg-red-950/70 border border-red-800 text-red-300'
                      }`}
                    >
                      {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md text-xs border border-slate-800 shrink-0">
                    {Number(tx.amount || 0).toFixed(2)} {currency}
                  </span>

                  {onSettle && (isDebtor || isCreditor) && !isCurrentItemFeedback && (
                    <button
                      type="button"
                      disabled={processingIdx === idx}
                      onClick={() => handleSettle(tx, idx)}
                      className="flex items-center gap-1 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {processingIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Saldar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}