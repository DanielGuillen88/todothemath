import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ExpenseNestedGroupAccordion({
  dateKey,
  dayData,
  isToday,
  isOpen,
  onToggle,
  currency,
  renderItem,
}) {
  return (
    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center pb-2 border-b border-slate-800/80 mb-2 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-indigo-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          <span className="font-semibold text-indigo-400 text-sm">{dateKey}</span>
          {isToday && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
              Hoy
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-emerald-400">
          {dayData.myTotal.toFixed(2)} {currency}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-4 pl-2 pt-2">
          {Object.entries(dayData.categories || {}).map(([catName, catData]) => (
            <div key={catName}>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-medium bg-slate-900/50 px-2 py-1 rounded">
                <span>
                  {catName} ({catData.items.length})
                </span>
                <span className="text-emerald-400 font-semibold mr-1.5">
                  {catData.myTotal.toFixed(2)} {currency}
                </span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {catData.items.map((exp) => renderItem(exp))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}