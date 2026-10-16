import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function SettlementList({ balances, currency = '€' }) {
  const settlements = balances?.settlements || balances?.transactions || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span>Liquidación Óptima</span>
      </h2>
      <p className="text-xs text-slate-400 mb-6">
        Transacciones calculadas para deudas compartidas (los gastos personales se excluyen automáticamente).
      </p>

      {settlements.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-slate-400 text-sm">
          No hay deudas pendientes entre los participantes.
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((tx, idx) => {
            const fromName = typeof tx.from === 'object' ? (tx.from?.name || tx.from?.email || 'Participante') : tx.from;
            const toName = typeof tx.to === 'object' ? (tx.to?.name || tx.to?.email || 'Participante') : tx.to;

            return (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-red-400">{fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-emerald-400">{toName}</span>
                </div>
                <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-md text-xs">
                  {Number(tx.amount || 0).toFixed(2)} {currency}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}