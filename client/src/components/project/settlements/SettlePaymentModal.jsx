import { Wallet } from 'lucide-react';
import { Button } from '../../ui';
import { PAYMENT_METHODS } from './paymentMethods';

export default function SettlePaymentModal({
  selectedTx,
  currency,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
  isMe,
  onCancel,
  onConfirm,
}) {
  if (!selectedTx) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-400" />
          <span>Registrar liquidación</span>
        </h3>

        <p className="text-xs text-slate-300">
          Confirmar el pago de{' '}
          <strong className="text-white font-semibold">
            {Number(selectedTx.amount || 0).toFixed(2)} {currency}
          </strong>{' '}
          de <span className="text-indigo-300 font-medium">{isMe(null, selectedTx.fromId) ? 'ti' : selectedTx.fromName}</span> a{' '}
          <span className="text-indigo-300 font-medium">{isMe(null, selectedTx.toId) ? 'ti' : selectedTx.toName}</span>.
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            ¿Cómo se realizó el pago?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/50 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </div>
  );
}