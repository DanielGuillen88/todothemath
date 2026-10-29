import { ArrowRight, Check, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { Button } from '../../ui';

export default function SettlementPendingItem({
  tx,
  idx,
  currency,
  resolveMemberId,
  isMe,
  expandedDebts,
  toggleDebtAccordion,
  getRelatedExpenses,
  onOpenSettleModal,
  canSettle,
}) {
  const actualFromId = resolveMemberId(tx.fromId || tx.from, tx.from);
  const actualToId = resolveMemberId(tx.toId || tx.to, tx.to);

  const isDebtor = isMe(tx.from, actualFromId);
  const isCreditor = isMe(tx.to, actualToId);

  const fromName = typeof tx.from === 'object'
    ? tx.from?.name || tx.from?.email || 'Participante'
    : tx.from;
  const toName = typeof tx.to === 'object'
    ? tx.to?.name || tx.to?.email || 'Participante'
    : tx.to;

  const debtKey = tx._id || `settle-${actualFromId}-${actualToId}-${idx}`;
  const isExpanded = Boolean(expandedDebts[debtKey]);
  const relatedExpenses = isExpanded ? getRelatedExpenses(actualFromId, actualToId) : [];

  return (
    <div
      className={`p-4 bg-slate-950 border rounded-xl flex flex-col gap-3 text-sm transition-colors ${
        isDebtor
          ? 'border-red-900/40 bg-red-950/10'
          : 'border-emerald-900/40 bg-emerald-950/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-medium flex-wrap">
          <span className={isDebtor ? 'text-red-400 font-semibold' : 'text-slate-300'}>
            {isDebtor ? 'Tú' : fromName}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className={isCreditor ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
            {isCreditor ? 'a ti' : toName}
          </span>

          {isDebtor ? (
            <span className="text-[11px] bg-red-950/80 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800/60 font-medium">
              Tienes que pagar
            </span>
          ) : (
            <span className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-medium">
              Te deben
            </span>
          )}

          <button
            type="button"
            onClick={() => toggleDebtAccordion(debtKey)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <Receipt className="w-3 h-3 text-indigo-400" />
            <span>¿De qué gastos viene?</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg text-sm border border-slate-800 shrink-0">
            {Number(tx.amount || 0).toFixed(2)} {currency}
          </span>

          {canSettle && (
            <Button
              size="sm"
              variant={isDebtor ? 'primary' : 'secondary'}
              icon={Check}
              onClick={() => onOpenSettleModal(tx)}
              className="shrink-0"
            >
              Marcar pagado
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
          <div className="text-[11px] text-slate-400 font-medium">
            Conceptos registrados donde {toName} pagó y {fromName} formó parte del reparto:
          </div>

          {relatedExpenses.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              Esta deuda proviene del balance acumulado simplificado del proyecto o de liquidaciones previas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {relatedExpenses.map((exp) => (
                <div
                  key={`debt-origin-${exp._id}`}
                  className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="text-slate-200 font-medium truncate">{exp.title}</p>
                    <span className="text-[10px] text-slate-500">
                      Total: {exp.totalAmount.toFixed(2)} {currency}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-emerald-400 shrink-0">
                    +{exp.shareAmount.toFixed(2)} {currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}