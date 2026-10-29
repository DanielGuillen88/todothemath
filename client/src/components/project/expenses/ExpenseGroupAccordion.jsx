import { ChevronDown, ChevronRight } from 'lucide-react';
import ExpenseItem from './ExpenseItem';

export default function ExpenseGroupAccordion({
  groupKey,
  groupData,
  isToday,
  isOpen,
  onToggle,
  currency,
  project,
  currentUser,
  isMe,
  getMyShareForExpense,
  onUpdateExpense,
  onDeleteExpense,
  groupBy,
}) {
  return (
    <div
      className={`border rounded-xl transition-colors overflow-hidden ${
        isToday
          ? 'border-indigo-500/40 bg-slate-950/70 shadow-xs'
          : 'border-slate-800/80 bg-slate-950/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/30 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-indigo-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          <div>
            <span className="font-semibold text-white text-sm">{groupKey}</span>
            {isToday && (
              <span className="ml-2 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Hoy
              </span>
            )}
            <span className="text-xs text-slate-500 ml-2">
              ({groupData.items.length} {groupData.items.length === 1 ? 'gasto' : 'gastos'})
            </span>
          </div>
        </div>

        <span className="text-sm font-bold text-emerald-400">
          {groupData.myTotal.toFixed(2)} {currency}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 divide-y divide-slate-800/40">
          {groupData.items.map((exp) => (
            <ExpenseItem
              key={exp._id}
              expense={exp}
              project={project}
              currentUser={currentUser}
              isMe={isMe}
              getMyShareForExpense={getMyShareForExpense}
              onUpdate={onUpdateExpense}
              onDelete={onDeleteExpense}
              groupBy={groupBy}
            />
          ))}
        </div>
      )}
    </div>
  );
}