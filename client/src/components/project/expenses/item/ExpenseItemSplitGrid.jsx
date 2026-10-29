import { Users } from 'lucide-react';
import { extractEntityId } from '../../../../utils/expenseHelpers';

export default function ExpenseItemSplitGrid({
  splitBetween = [],
  totalAmount,
  currency,
  project,
  isMe,
}) {
  if (!splitBetween || splitBetween.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reparto entre participantes ({splitBetween.length}):</span>
        </span>
        <span className="text-slate-500 font-mono text-[10px]">
          Total: {totalAmount.toFixed(2)} {currency}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
        {splitBetween.map((splitItem, idx) => {
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
            splitItem.share ?? (totalAmount / splitBetween.length)
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
  );
}