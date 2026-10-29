import { CheckCircle2, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '../../ui';
import { PAYMENT_METHODS } from './paymentMethods';

export default function SettlementHistoryItem({
  item,
  idx,
  currency,
  resolveMemberId,
  isMe,
  confirmRevertId,
  setConfirmRevertId,
  revertingId,
  onRevert,
  canRevert,
}) {
  const actualFromId = resolveMemberId(item.fromId || item.from, item.from);
  const fromName = typeof item.from === 'object' ? (item.from?.name || item.from?.email) : item.from;
  const toName = typeof item.to === 'object' ? (item.to?.name || item.to?.email) : item.to;
  const userIsPayer = isMe(item.from, actualFromId);

  const methodInfo = PAYMENT_METHODS.find((m) => m.id === item.method) || PAYMENT_METHODS[0];
  const MethodIcon = methodInfo.icon;
  const itemId = item._id || item.id || `hist-${idx}`;

  return (
    <div className="p-4 bg-slate-950/80 border border-emerald-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-white">
              {userIsPayer
                ? `Tú pagaste a ${toName || 'Usuario'}`
                : `${fromName || 'Usuario'} te pagó a ti`}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
              {Number(item.amount || 0).toFixed(2)} {currency}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MethodIcon className="w-3 h-3 text-slate-400" />
              {methodInfo.label}
            </span>
            <span>•</span>
            <span>{item.date ? new Date(item.date).toLocaleDateString() : 'Recientemente'}</span>
          </div>
        </div>
      </div>

      {canRevert && (
        <div className="self-end sm:self-auto shrink-0">
          {confirmRevertId === itemId ? (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-900/60 px-2 py-1 rounded-lg animate-in fade-in zoom-in-95">
              <span className="text-[11px] text-amber-300 font-medium mr-1">
                ¿Deshacer pago?
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon={Check}
                isLoading={revertingId === itemId}
                onClick={() => onRevert(itemId)}
                className="px-1.5 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                title="Confirmar reversión"
              />
              <Button
                size="sm"
                variant="ghost"
                icon={X}
                disabled={revertingId === itemId}
                onClick={() => setConfirmRevertId(null)}
                className="px-1.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Cancelar"
              />
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              onClick={() => setConfirmRevertId(itemId)}
              title="Deshacer pago y volver a incluir en deudas"
              className="text-slate-400 hover:text-amber-400 hover:bg-slate-800"
            >
              Deshacer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}