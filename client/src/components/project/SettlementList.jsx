import { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  RotateCcw, 
  Wallet, 
  CreditCard, 
  Banknote, 
  Smartphone,
  History
} from 'lucide-react';
import { extractEntityId } from '../../utils/expenseHelpers/index.js';
import { Button } from '../ui';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'bizum', label: 'Bizum', icon: Smartphone },
  { id: 'bank', label: 'Transferencia Bancaria', icon: CreditCard },
  { id: 'other', label: 'Otro', icon: Wallet },
];

export default function SettlementList({
  balances,
  currency = '€',
  currentUser,
  onSettle,
  onRevertSettle,
  settlementHistory = [],
}) {
  // 1. Identificadores robustos del usuario actual
  const currentUserId = String(
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    extractEntityId(currentUser) ||
    ''
  );

  const currentUserEmail = String(
    currentUser?.email || currentUser?.user?.email || ''
  ).toLowerCase().trim();

  // Función universal para verificar si una entidad corresponde al usuario autenticado
  const isMe = (entity, entityId) => {
    if (entityId && String(entityId) === currentUserId) return true;
    if (!entity) return false;

    if (typeof entity === 'string') {
      const val = entity.trim();
      if (currentUserId && val === currentUserId) return true;
      if (currentUserEmail && val.toLowerCase() === currentUserEmail) return true;
      return false;
    }

    const resolvedId = String(
      entity._id || entity.id || entity.userId || entity.user?._id || entity.user?.id || extractEntityId(entity) || ''
    );
    const resolvedEmail = String(entity.email || entity.user?.email || '').toLowerCase().trim();

    return Boolean(
      (currentUserId && resolvedId && resolvedId === currentUserId) ||
      (currentUserEmail && resolvedEmail && resolvedEmail === currentUserEmail)
    );
  };

  // 2. Transacciones originales que vienen del backend
  const allSettlements = balances?.settlements || balances?.transactions || [];

  // 3. Filtrado de privacidad estricta: solo lo que concierne al usuario logueado
  const myPendingSettlements = allSettlements.filter((tx) => {
    return isMe(tx.from, tx.fromId) || isMe(tx.to, tx.toId);
  });

  const myHistory = settlementHistory.filter((st) => {
    return isMe(st.from, st.fromId) || isMe(st.to, st.toId);
  });

  // Estados locales
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [selectedTx, setSelectedTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bizum');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleOpenSettleModal = (txData) => {
    setSelectedTx(txData);
    setPaymentMethod('bizum');
    setFeedback(null);
  };

  const handleConfirmSettle = async () => {
    if (!selectedTx || !onSettle) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await onSettle({
        from: selectedTx.fromId,
        to: selectedTx.toId,
        amount: Number(selectedTx.amount || 0),
        method: paymentMethod,
      });

      setSelectedTx(null);
      setFeedback({ type: 'success', text: 'Deuda registrada como pagada.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al liquidar la deuda.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async (settlementId) => {
    if (!onRevertSettle) return;
    setRevertingId(settlementId);

    try {
      await onRevertSettle(settlementId);
      setFeedback({ type: 'success', text: 'Liquidación deshecha. Se ha devuelto al balance.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al revertir la liquidación.',
      });
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative">
      {/* Cabecera y Selector de pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Tus Liquidaciones y Deudas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Solo tú puedes ver las transferencias en las que debes pagar o recibir dinero.
          </p>
        </div>

        {/* Pestañas: Pendientes vs Historial */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes ({myPendingSettlements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({myHistory.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/50 border border-red-800/80 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* PESTAÑA 1: DEUDAS PENDIENTES */}
      {activeTab === 'pending' && (
        <>
          {myPendingSettlements.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-sm">
              🎉 No tienes deudas pendientes ni nadie te debe dinero en este proyecto.
            </div>
          ) : (
            <div className="space-y-3">
              {myPendingSettlements.map((tx, idx) => {
                const actualFromId = String(tx.fromId || extractEntityId(tx.from) || tx.from);
                const actualToId = String(tx.toId || extractEntityId(tx.to) || tx.to);

                const isDebtor = actualFromId === currentUserId;
                const isCreditor = actualToId === currentUserId;

                const fromName = typeof tx.from === 'object'
                  ? tx.from?.name || tx.from?.email || 'Participante'
                  : tx.from;
                const toName = typeof tx.to === 'object'
                  ? tx.to?.name || tx.to?.email || 'Participante'
                  : tx.to;

                return (
                  <div
                    key={tx._id || `settle-${actualFromId}-${actualToId}-${idx}`}
                    className={`p-4 bg-slate-950 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-colors ${
                      isDebtor
                        ? 'border-red-900/40 bg-red-950/10'
                        : 'border-emerald-900/40 bg-emerald-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-medium flex-wrap">
                      <span className={isDebtor ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {fromName} {isDebtor ? '(Tú)' : ''}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className={isCreditor ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                        {toName} {isCreditor ? '(Tú)' : ''}
                      </span>

                      {isDebtor ? (
                        <span className="text-[11px] bg-red-950/80 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800/60 font-medium">
                          Tienes que pagar
                        </span>
                      ) : (
                        <span className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800/60 font-medium">
                          Te deben
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg text-sm border border-slate-800 shrink-0">
                        {Number(tx.amount || 0).toFixed(2)} {currency}
                      </span>

                      {onSettle && (
                        <Button
                          size="sm"
                          variant={isDebtor ? 'primary' : 'secondary'}
                          icon={Check}
                          onClick={() => handleOpenSettleModal({
                            ...tx,
                            fromId: actualFromId,
                            toId: actualToId,
                            fromName,
                            toName,
                          })}
                          className="shrink-0"
                        >
                          Marcar pagado
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PESTAÑA 2: HISTORIAL DE LIQUIDACIONES PAGADAS */}
      {activeTab === 'history' && (
        <>
          {myHistory.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-sm">
              Aún no se ha registrado ninguna liquidación como pagada.
            </div>
          ) : (
            <div className="space-y-3">
              {myHistory.map((item, idx) => {
                const actualFromId = String(item.fromId || extractEntityId(item.from) || item.from);
                const fromName = typeof item.from === 'object' ? (item.from?.name || item.from?.email) : item.from;
                const toName = typeof item.to === 'object' ? (item.to?.name || item.to?.email) : item.to;

                const methodInfo = PAYMENT_METHODS.find((m) => m.id === item.method) || PAYMENT_METHODS[0];
                const MethodIcon = methodInfo.icon;

                return (
                  <div
                    key={item._id || `hist-${idx}`}
                    className="p-4 bg-slate-950/80 border border-emerald-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-white">
                            {fromName || 'Usuario'} pagó a {toName || 'Usuario'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                            {Number(item.amount || 0).toFixed(2)} {currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MethodIcon className="w-3 h-3 text-slate-400" />
                            {methodInfo.label}
                          </span>
                          <span>•</span>
                          <span>{item.date ? new Date(item.date).toLocaleDateString() : 'Recientemente'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón para deshacer el pago */}
                    {onRevertSettle && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={RotateCcw}
                        isLoading={revertingId === item._id}
                        onClick={() => handleRevert(item._id)}
                        title="Deshacer pago y volver a incluir en deudas"
                        className="text-slate-400 hover:text-amber-400 hover:bg-slate-800 self-end sm:self-auto"
                      >
                        Deshacer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL PARA SELECCIONAR MÉTODO DE PAGO */}
      {selectedTx && (
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
              de <span className="text-indigo-300 font-medium">{selectedTx.fromName}</span> a{' '}
              <span className="text-indigo-300 font-medium">{selectedTx.toName}</span>.
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
                onClick={() => setSelectedTx(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSettle}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Confirmar Pago
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}