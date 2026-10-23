import { Input, Select } from '../ui';
import { extractEntityId } from '../../utils/expenseHelpers';

export default function ExpenseFields({
  values,
  onChange,
  project,
  currentUser,
  disabled = false,
  showSplitSelector = false,
  selectedMembers = [],
  onToggleMember = () => {},
}) {
  const isShared = !values.isPersonal;

  const handleSharedCheckboxChange = (e) => {
    const willBeShared = e.target.checked;
    // Si se marca como compartido -> isPersonal: false
    // Si se desmarca -> isPersonal: true
    onChange('isPersonal', !willBeShared);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2">
          <Input
            id="expense-title"
            label="Concepto"
            type="text"
            disabled={disabled}
            value={values.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Cena, Peajes, Entradas..."
          />
        </div>

        <div>
          <Input
            id="expense-amount"
            label={`Importe (${project?.currency || '€'})`}
            type="number"
            step="any"
            min="0.01"
            disabled={disabled}
            value={values.amount}
            onChange={(e) => onChange('amount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Input
            id="expense-date"
            label="Fecha"
            type="date"
            disabled={disabled}
            value={values.date}
            onChange={(e) => onChange('date', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            id="expense-category"
            label="Categoría"
            disabled={disabled}
            value={values.category}
            onChange={(e) => onChange('category', e.target.value)}
          >
            <option value="Otros">Otros</option>
            <option value="Ocio">Ocio</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Alojamiento">Alojamiento</option>
            <option value="Supermercado">Supermercado</option>
            <option value="Personales">Personales</option>
          </Select>
        </div>

        {/* Checkbox invertido: desmarcado = personal, marcado = compartido */}
        <div className="sm:col-span-3 pt-2">
          <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-medium select-none">
            <input
              type="checkbox"
              disabled={disabled}
              checked={isShared}
              onChange={handleSharedCheckboxChange}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            />
            <span>Gasto compartido (dividir con otros miembros del proyecto)</span>
          </label>
          <p className="text-[11px] text-slate-500 pl-6.5 mt-0.5">
            {isShared
              ? 'Este gasto entrará en el cálculo de saldos y se repartirá con los miembros seleccionados abajo.'
              : 'Gasto personal: solo tú lo asumes, no afectará a los saldos de los demás.'}
          </p>
        </div>
      </div>

      {/* Selector de reparto: SOLO visible cuando está marcado como compartido */}
      {showSplitSelector && isShared && project?.members && project.members.length > 1 && (
        <div className="mt-3.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Dividir gasto entre:</span>
            <span className="text-[11px] font-semibold text-indigo-400">
              {selectedMembers.length} seleccionados (
              {Number(values.amount ? (Number(values.amount) / (selectedMembers.length || 1)).toFixed(2) : 0)}{' '}
              {project?.currency || '€'}/persona)
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {project.members.map((m, idx) => {
              const memberId = extractEntityId(m);
              const isIncluded = selectedMembers.some((mid) => extractEntityId(mid) === memberId);
              const memberName = m?.name || `Usuario (${memberId.slice(-4)})`;
              const isCurrent = memberId === extractEntityId(currentUser);

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
                  <span>{memberName} {isCurrent ? '(Tú)' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}