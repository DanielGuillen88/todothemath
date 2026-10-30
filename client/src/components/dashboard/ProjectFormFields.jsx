import { Input, Select } from '../ui';

const PROJECT_TYPES = [
  { value: 'trip', label: 'Viaje' },
  { value: 'event', label: 'Evento' },
  { value: 'renovation', label: 'Reforma' },
  { value: 'other', label: 'Otro' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'MXN', label: 'MXN ($)' },
];

export default function ProjectFormFields({ values, onChange, disabled = false }) {
  return (
    <div className="space-y-4">
      <Input
        label="Nombre del proyecto *"
        name="title"
        value={values.title}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Ej. Viaje a París 2026"
        disabled={disabled}
        required
      />

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-300">
          Descripción (opcional)
        </label>
        <textarea
          name="description"
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Añade notas o detalles del proyecto..."
          rows={3}
          disabled={disabled}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          label="Tipo"
          name="type"
          value={values.type}
          onChange={(e) => onChange('type', e.target.value)}
          options={PROJECT_TYPES}
          disabled={disabled}
        />

        <Input
          label="Presupuesto"
          name="budget"
          type="number"
          step="0.01"
          min="0"
          value={values.budget}
          onChange={(e) => onChange('budget', e.target.value)}
          placeholder="0.00"
          disabled={disabled}
        />

        <Select
          label="Moneda"
          name="currency"
          value={values.currency}
          onChange={(e) => onChange('currency', e.target.value)}
          options={CURRENCIES}
          disabled={disabled}
        />
      </div>
    </div>
  );
}