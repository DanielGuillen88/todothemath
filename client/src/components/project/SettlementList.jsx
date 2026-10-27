import { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Check,
  X,
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
  { id: 'bizum', label: 'Bizum', icon: Smartphone },
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'bank', label: 'Transferencia', icon: CreditCard },
  { id: 'other', label: 'Otro', icon: Wallet },
];

export default function SettlementList({
  project,
  balances,
  currency = '€',
  currentUser,
  onSettle,
  onRevertSettle,
  settlementHistory = [],
}) {

  const [confirmRevertId, setConfirmRevertId] = useState(null);

  // 1. Identificadores robustos del usuario autenticado
  const currentUserId = String(
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    currentUser?.data?.user?._id ||
    currentUser?.data?.user?.id ||
    extractEntityId(currentUser) ||
    ''
  ).trim();

  const currentUserEmail = String(
    currentUser?.email || 
    currentUser?.user?.email || 
    currentUser?.data?.user?.email || 
    ''
  ).toLowerCase().trim();

  const currentUserName = String(
    currentUser?.name || 
    currentUser?.user?.name || 
    currentUser?.data?.user?.name || 
    ''
  ).toLowerCase().trim();

  // 2. Validador y extractor estricto de Mongo ObjectId (24 hex chars)
  const isMongoId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

  // Resuelve siempre el ObjectId de MongoDB buscando en project.members si viene como nombre
  const resolveMemberId = (val, entityObj) => {
    const extractedFromObj = extractEntityId(entityObj);
    if (isMongoId(extractedFromObj)) return extractedFromObj;

    const extractedFromVal = extractEntityId(val);
    if (isMongoId(extractedFromVal)) return extractedFromVal;

    if (isMongoId(val)) return String(val).trim();

    const searchStr = String(val?.name || val || '').toLowerCase().trim();
    if (searchStr) {
      if (currentUserId && (searchStr === currentUserName || searchStr === currentUserEmail)) {
        return currentUserId;
      }

      if (Array.isArray(project?.members)) {
        const found = project.members.find((m) => {
          const mId = extractEntityId(m);
          const mName = String(m?.name || '').toLowerCase().trim();
          const mEmail = String(m?.email || '').toLowerCase().trim();
          return mName === searchStr || mEmail === searchStr || mId === searchStr;
        });
        if (found) return extractEntityId(found);
      }
    }

    return extractedFromObj || extractedFromVal || String(val || '');
  };

  const isMe = (entity, entityId) => {
    const idToTest = String(
      entityId || 
      extractEntityId(entity) || 
      (typeof entity === 'string' && !entity.includes('@') ? entity : entity?._id || entity?.id || '')
    ).trim();

    if (currentUserId && idToTest && currentUserId === idToTest) return true;

    const emailToTest = String(
      entity?.email || 
      (typeof entity === 'string' && entity.includes('@') ? entity : '')
    ).toLowerCase().trim();

    if (currentUserEmail && emailToTest && currentUserEmail === emailToTest) return true;

    const nameToTest = String(
      entity?.name || 
      (typeof entity === 'string' ? entity : '')
    ).toLowerCase().trim();

    if (currentUserName && nameToTest && currentUserName === nameToTest) return true;

    return false;
  };

  // 3. Extracción segura de liquidaciones
  const allSettlements = Array.isArray(balances?.settlements)
    ? balances.settlements
    : Array.isArray(balances?.transactions)
    ? balances.transactions
    : [];

  const myPendingSettlements = allSettlements.filter((tx) => {
    if (!currentUserId && !currentUserEmail && !currentUserName) return true;

    const fId = resolveMemberId(tx.fromId || tx.from, tx.from);
    const tId = resolveMemberId(tx.toId || tx.to, tx.to);

    return isMe(tx.from, fId) || isMe(tx.to, tId);
  });

  const myHistory = settlementHistory.filter((st) => {
    if (!currentUserId && !currentUserEmail && !currentUserName) return true;

    const fId = resolveMemberId(st.fromId || st.from, st.from);
    const tId = resolveMemberId(st.toId || st.to, st.to);

    return isMe(st.from, fId) || isMe(st.to, tId);
  });

  // Estados locales
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTx, setSelectedTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bizum');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleOpenSettleModal = (txData) => {
    const cleanFromId = resolveMemberId(txData.fromId || txData.from, txData.from);
    const cleanToId = resolveMemberId(txData.toId || txData.to, txData.to);

    const fromName = typeof txData.from === 'object'
      ? txData.from?.name || txData.from?.email || 'Participante'
      : txData.fromName || txData.from || 'Participante';

    const toName = typeof txData.to === 'object'
      ? txData.to?.name || txData.to?.email || 'Participante'
      : txData.toName || txData.to || 'Participante';

    setSelectedTx({
      ...txData,
      fromId: cleanFromId,
      toId: cleanToId,
      fromName,
      toName,
    });
    setPaymentMethod('bizum');
    setFeedback(null);
  };

  const handleConfirmSettle = async () => {
    if (!selectedTx || !onSettle) return;

    if (!isMongoId(selectedTx.fromId) || !isMongoId(selectedTx.toId)) {
      setFeedback({
        type: 'error',
        text: 'Error de identificación: no se pudo resolver el ID de uno de los participantes.',
      });
      return;
    }

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
      setFeedback({ type: 'success', text: 'Pago registrado con éxito.' });
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
      setConfirmRevertId(null); // 👈 limpia la confirmación
      setFeedback({ type: 'success', text: 'Liquidación deshecha. Vuelve a figurar en pendientes.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al revertir la liquidación.',
      });
      setConfirmRevertId(null);
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Liquidaciones y Deudas</span>
          </h2>
        </div>

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
                const actualFromId = resolveMemberId(tx.fromId || tx.from, tx.from);
                const actualToId = resolveMemberId(tx.toId || tx.to, tx.to);

                const isDebtor = isMe(tx.from, actualFromId);
                const isCreditor = isMe(tx.to, actualToId);

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
                        {isDebtor ? 'Tú' : fromName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className={isCreditor ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                        {isCreditor ? 'a ti' : toName}
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
                          onClick={() => handleOpenSettleModal(tx)}
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
                const actualFromId = resolveMemberId(item.fromId || item.from, item.from);
                const fromName = typeof item.from === 'object' ? (item.from?.name || item.from?.email) : item.from;
                const toName = typeof item.to === 'object' ? (item.to?.name || item.to?.email) : item.to;

                const userIsPayer = isMe(item.from, actualFromId);

                const methodInfo = PAYMENT_METHODS.find((m) => m.id === item.method) || PAYMENT_METHODS[0];
                const MethodIcon = methodInfo.icon;

                return (
                  <div
                    key={item._id || item.id || `hist-${idx}`}
                    className="p-4 bg-slate-950/80 border border-emerald-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-white">
                            {userIsPayer
                              ? `Tú pagaste a ${toName || 'Usuario'}`
                              : `${fromName || 'Usuario'} te pagó a ti`}
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

                    {onRevertSettle && (
                      <div className="self-end sm:self-auto shrink-0">
                        {confirmRevertId === (item._id || item.id) ? (
                          <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-900/60 px-2 py-1 rounded-lg animate-in fade-in zoom-in-95">
                            <span className="text-[11px] text-amber-300 font-medium mr-1">
                              ¿Deshacer pago?
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Check}
                              isLoading={revertingId === (item._id || item.id)}
                              onClick={() => handleRevert(item._id || item.id)}
                              className="px-1.5 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                              title="Confirmar reversión"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={X}
                              disabled={revertingId === (item._id || item.id)}
                              onClick={() => setConfirmRevertId(null)}
                              className="px-1.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                              title="Cancelar"
                            />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={RotateCcw}
                            onClick={() => setConfirmRevertId(item._id || item.id)}
                            title="Deshacer pago y volver a incluir en deudas"
                            className="text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                          >
                            Deshacer
                          </Button>
                        )}
                      </div>
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