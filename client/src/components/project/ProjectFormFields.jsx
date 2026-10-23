import { ShieldCheck, Zap } from 'lucide-react';

const SETTLEMENT_MODES = [
  {
    id: 'direct',
    title: 'Deudas Directas (Privado / P2P)',
    desc: 'Solo debes dinero a quien pagó lo que tú consumiste. Nadie ajeno interviene en tus cuentas.',
    icon: ShieldCheck,
  },
  {
    id: 'simplified',
    title: 'Minimizar Pagos (Óptimo / Grupal)',
    desc: 'Calcula el balance global para hacer el menor número de transferencias posibles entre todos.',
    icon: Zap,
  },
];

export default function ProjectFormFields({ values, onChange, disabled = false }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Título del Proyecto *
        </label>
        <input
          type="text"
          required
          disabled={disabled}
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Ej. Vacaciones Menorca, Piso Compartido..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Descripción
        </label>
        <textarea
          rows={3}
          disabled={disabled}
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Breve detalle sobre los gastos comunes..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Tipo de Evento
          </label>
          <select
            disabled={disabled}
            value={values.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="trip">Viaje / Escapada</option>
            <option value="home">Piso Compartido / Hogar</option>
            <option value="event">Evento / Celebración</option>
            <option value="couple">Pareja</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Moneda
          </label>
          <select
            disabled={disabled}
            value={values.currency}
            onChange={(e) => onChange('currency', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dólar ($)</option>
            <option value="GBP">Libra (£)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Presupuesto Estimado (Opcional)
        </label>
        <input
          type="number"
          min="0"
          step="any"
          disabled={disabled}
          value={values.budget}
          onChange={(e) => onChange('budget', e.target.value)}
          placeholder="1000"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="space-y-2 pt-1">
        <label className="block text-xs font-medium text-slate-400">
          Método de Liquidación de Deudas
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SETTLEMENT_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = values.settlementMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => !disabled && onChange('settlementMode', mode.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{mode.title}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 rounded font-medium">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}