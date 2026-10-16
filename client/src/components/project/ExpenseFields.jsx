export default function ExpenseFields({ values, onChange, project, currentUser, disabled = false, showSplitSelector = false, selectedMembers = [], onToggleMember = () => {}, }) {
    
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Concepto</label>
          <input
            type="text"
            // required
            disabled={disabled}
            value={values.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Cena, Peajes, Entradas..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Importe ({project?.currency || '€'})
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            // required
            disabled={disabled}
            value={values.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Fecha</label>
          <input
            type="date"
            // required
            disabled={disabled}
            value={values.date}
            onChange={(e) => onChange('date', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Categoría</label>
          <select
            disabled={disabled}
            value={values.category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="Otros">Otros</option>
            <option value="Ocio">Ocio</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Alojamiento">Alojamiento</option>
            <option value="Supermercado">Supermercado</option>
            <option value="Personales">Personales</option>
          </select>
        </div>

        {/* Solo visible si el gasto no es personal */}
        {!values.isPersonal && (
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Pagado por</label>
            <select
              disabled={disabled}
              value={String(values.paidBy || '')}
              onChange={(e) => onChange('paidBy', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              {project?.members?.map((m, mIdx) => {
                const memberId = String(m?._id || m?.id || (typeof m === 'string' ? m : ''));
                const isCurrent = memberId === currentUserId;
                const memberName = m?.name || (memberId ? `Miembro (${memberId.slice(-4)})` : `Miembro ${mIdx + 1}`);

                return (
                  <option key={memberId || `mem-${mIdx}`} value={memberId}>
                    {memberName} {isCurrent ? '(Tú)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="sm:col-span-3 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              disabled={disabled}
              checked={values.isPersonal}
              onChange={(e) => onChange('isPersonal', e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Gasto personal (solo lo asume quien pagó, no entra en el reparto)</span>
          </label>
        </div>
      </div>

      {/* Selector de reparto entre miembros (opcional para creación o edición avanzada) */}
      {showSplitSelector && !values.isPersonal && project?.members && project.members.length > 1 && (
        <div className="mt-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400">Dividir gasto entre:</span>
            <span className="text-[11px] text-indigo-400">
              {selectedMembers.length} seleccionados (
              {Number(values.amount ? (Number(values.amount) / (selectedMembers.length || 1)).toFixed(2) : 0)}{' '}
              {project?.currency || '€'}/persona)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.members.map((m, idx) => {
              const memberId = String(m?._id || m?.id || m);
              const isIncluded = selectedMembers.some((mid) => String(mid) === memberId);
              const memberName = m?.name || `Usuario (${memberId.slice(-4)})`;

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
                  <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-indigo-400' : 'bg-slate-600'}`}></span>
                  {memberName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}