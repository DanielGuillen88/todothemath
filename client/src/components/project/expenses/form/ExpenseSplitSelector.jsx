import { extractEntityId } from '../../../../utils/expenseHelpers';

export default function ExpenseSplitSelector({
  activeMembers = [],
  selectedMembers = [],
  onToggleMember,
  disabled = false,
  perPersonShare,
  currency = '€',
  currentUser,
}) {
  const currentUserId = extractEntityId(currentUser);

  return (
    <div className="mt-3.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">Dividir gasto entre:</span>
        <span className="text-[11px] font-semibold text-indigo-400">
          {selectedMembers.length} seleccionados ({perPersonShare} {currency}/persona)
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {activeMembers.map((m, idx) => {
          const memberUserData = m?.user || m;
          const memberId =
            extractEntityId(memberUserData) ||
            String(memberUserData?._id || memberUserData?.id || memberUserData || '');

          const isIncluded = selectedMembers.some((mid) => extractEntityId(mid) === memberId);
          const memberName =
            memberUserData?.name ||
            (memberUserData?.email ? memberUserData.email.split('@')[0] : `Usuario (${memberId.slice(-4)})`);
          const isCurrent = memberId === currentUserId;

          return (
            <button
              key={`split-${memberId}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onToggleMember(memberId)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isIncluded
                  ? 'bg-indigo-950/80 border-indigo-600/70 text-indigo-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-indigo-400' : 'bg-slate-600'}`} />
              <span>{isCurrent ? 'Tú' : memberName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}