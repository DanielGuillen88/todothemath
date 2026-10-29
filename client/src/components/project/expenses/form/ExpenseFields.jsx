import { Input, Select } from '../../../ui';
import ExpenseSplitSelector from './ExpenseSplitSelector';
import { EXPENSE_CATEGORIES } from './categories';

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
    onChange('isPersonal', !e.target.checked);
  };

  const handleCategoryChange = (eOrValue) => {
    const newCategory = (eOrValue && typeof eOrValue === 'object' && eOrValue.target)
      ? eOrValue.target.value
      : eOrValue;

    onChange('category', newCategory);
  };

  const numericAmount = Number(values.amount) || 0;
  const count = selectedMembers.length || 1;
  const perPersonShare = (numericAmount / count).toFixed(2);
  const currency = project?.currency || '€';

  const selectOptions = EXPENSE_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const activeMembers = (project?.members || []).filter((m) => m?.status !== 'pending');

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2">
          <Input
            id="expense-title"
            label="Concepto"
            type="text"
            disabled={disabled}
            value={values.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Cena, Peajes, Entradas..."
          />
        </div>

        <div>
          <Input
            id="expense-amount"
            label={`Importe (${currency})`}
            type="number"
            step="any"
            min="0.01"
            disabled={disabled}
            value={values.amount !== undefined ? values.amount : ''}
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
            value={values.date || ''}
            onChange={(e) => onChange('date', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Select
            id="expense-category"
            label="Categoría"
            disabled={disabled}
            value={values.category || 'Otros'}
            onChange={handleCategoryChange}
            options={selectOptions}
          />
        </div>

        {/* Checkbox compartido / personal */}
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

      {showSplitSelector && isShared && activeMembers.length > 1 && (
        <ExpenseSplitSelector
          activeMembers={activeMembers}
          selectedMembers={selectedMembers}
          onToggleMember={onToggleMember}
          disabled={disabled}
          perPersonShare={perPersonShare}
          currency={currency}
          currentUser={currentUser}
        />
      )}
    </>
  );
}