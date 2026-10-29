import { CheckCircle2, AlertCircle, History } from 'lucide-react';
import { SettlementPendingItem, SettlementHistoryItem, SettlePaymentModal } from '../settlements';
import { useSettlementLogic } from './useSettlementLogic';

export default function SettlementList({
  project,
  balances,
  expenses = [],
  currency = '€',
  currentUser,
  onSettle,
  onRevertSettle,
  settlementHistory = [],
}) {
  const {
    activeTab,
    setActiveTab,
    myPendingSettlements,
    myHistory,
    feedback,
    confirmRevertId,
    setConfirmRevertId,
    revertingId,
    expandedDebts,
    toggleDebtAccordion,
    getRelatedExpenses,
    resolveMemberId,
    isMe,
    selectedTx,
    setSelectedTx,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    handleOpenSettleModal,
    handleConfirmSettle,
    handleRevert,
  } = useSettlementLogic({
    project,
    balances,
    expenses,
    currentUser,
    settlementHistory,
    onSettle,
    onRevertSettle,
  });

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
              {myPendingSettlements.map((tx, idx) => (
                <SettlementPendingItem
                  key={tx._id || `settle-${idx}`}
                  tx={tx}
                  idx={idx}
                  currency={currency}
                  resolveMemberId={resolveMemberId}
                  isMe={isMe}
                  expandedDebts={expandedDebts}
                  toggleDebtAccordion={toggleDebtAccordion}
                  getRelatedExpenses={getRelatedExpenses}
                  onOpenSettleModal={handleOpenSettleModal}
                  canSettle={Boolean(onSettle)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* PESTAÑA 2: HISTORIAL DE PAGADOS */}
      {activeTab === 'history' && (
        <>
          {myHistory.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-sm">
              Aún no se ha registrado ninguna liquidación como pagada.
            </div>
          ) : (
            <div className="space-y-3">
              {myHistory.map((item, idx) => (
                <SettlementHistoryItem
                  key={item._id || item.id || `hist-${idx}`}
                  item={item}
                  idx={idx}
                  currency={currency}
                  resolveMemberId={resolveMemberId}
                  isMe={isMe}
                  confirmRevertId={confirmRevertId}
                  setConfirmRevertId={setConfirmRevertId}
                  revertingId={revertingId}
                  onRevert={handleRevert}
                  canRevert={Boolean(onRevertSettle)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      <SettlePaymentModal
        selectedTx={selectedTx}
        currency={currency}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isSubmitting={isSubmitting}
        isMe={isMe}
        onCancel={() => setSelectedTx(null)}
        onConfirm={handleConfirmSettle}
      />
    </div>
  );
}