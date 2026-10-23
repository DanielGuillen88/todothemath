/**
 * Calcula balances y liquidaciones según el modo elegido:
 * - 'simplified' (Greedy): Minimiza transferencias globales entre todos.
 * - 'direct' (P2P / Convencional): Deudas directas únicamente entre quien consume y quien pagó.
 */
export const calculateBalances = (expenses = [], members = [], mode = 'direct') => {
  const balanceMap = new Map();
  const memberNames = new Map();

  // 1. Inicializar miembros y mapa de nombres
  members.forEach((m) => {
    if (!m) return;
    const id = String(m._id || m.id || m);
    const name = m.name || m.email || `Usuario (${id.slice(-4)})`;
    balanceMap.set(id, { id, name, paid: 0, owes: 0, net: 0 });
    memberNames.set(id, name);
  });

  // Matriz de deuda directa: directDebts[deudor][acreedor] = total
  const directDebts = new Map();

  const addDirectDebt = (debtorId, creditorId, amount) => {
    if (!debtorId || !creditorId || debtorId === creditorId || amount <= 0) return;
    if (!directDebts.has(debtorId)) {
      directDebts.set(debtorId, new Map());
    }
    const debtorMap = directDebts.get(debtorId);
    const current = debtorMap.get(creditorId) || 0;
    debtorMap.set(creditorId, current + amount);
  };

  // 2. Procesar cada gasto
  expenses.forEach((exp) => {
    if (!exp || exp.isPersonal) return;

    const amount = Number(exp.amount || 0);
    if (amount <= 0) return;

    const payerId = String(exp.paidBy?._id || exp.paidBy?.id || exp.paidBy || '');
    if (payerId && balanceMap.has(payerId)) {
      balanceMap.get(payerId).paid += amount;
    }

    // Si es un registro de liquidación (reembolso directo de A a B)
    if (exp.isSettlement) {
      const recipientSplit = Array.isArray(exp.splitBetween) && exp.splitBetween[0];
      const recipientId = String(recipientSplit?.user?._id || recipientSplit?.user?.id || recipientSplit?.user || '');
      
      if (recipientId && balanceMap.has(recipientId)) {
        balanceMap.get(recipientId).owes += amount;
      }
      // En modo directo, el reembolso resta la deuda del pagador hacia el receptor
      if (payerId && recipientId) {
        addDirectDebt(payerId, recipientId, -amount);
      }
      return;
    }

    // Gasto compartido regular
    if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
      exp.splitBetween.forEach((split) => {
        if (!split) return;
        const userId = String(split.user?._id || split.user?.id || split.user || '');
        const share = Number(split.share) || (amount / exp.splitBetween.length);

        if (userId && balanceMap.has(userId)) {
          balanceMap.get(userId).owes += share;
          if (payerId && userId !== payerId) {
            addDirectDebt(userId, payerId, share);
          }
        }
      });
    } else if (members.length > 0) {
      const equalShare = amount / members.length;
      members.forEach((m) => {
        const id = String(m._id || m.id || m);
        if (balanceMap.has(id)) {
          balanceMap.get(id).owes += equalShare;
          if (payerId && id !== payerId) {
            addDirectDebt(id, payerId, equalShare);
          }
        }
      });
    }
  });

  // 3. Balances netos individuales
  const balances = [];
  const debtors = [];
  const creditors = [];

  balanceMap.forEach((entry) => {
    const net = Number((entry.paid - entry.owes).toFixed(2));
    entry.net = net;
    entry.paid = Number(entry.paid.toFixed(2));
    entry.owes = Number(entry.owes.toFixed(2));
    balances.push(entry);

    if (net < -0.01) debtors.push({ ...entry, amount: Math.abs(net) });
    else if (net > 0.01) creditors.push({ ...entry, amount: net });
  });

  // 4. MODO DIRECTO (Peer-to-Peer bilateral)
  if (mode === 'direct') {
    const settlements = [];
    const allMemberIds = Array.from(balanceMap.keys());

    for (let i = 0; i < allMemberIds.length; i++) {
      for (let j = i + 1; j < allMemberIds.length; j++) {
        const userA = allMemberIds[i];
        const userB = allMemberIds[j];

        const aOwesB = directDebts.get(userA)?.get(userB) || 0;
        const bOwesA = directDebts.get(userB)?.get(userA) || 0;

        const diff = Number((aOwesB - bOwesA).toFixed(2));

        if (diff > 0.01) {
          settlements.push({
            from: memberNames.get(userA),
            fromId: userA,
            to: memberNames.get(userB),
            toId: userB,
            amount: diff,
          });
        } else if (diff < -0.01) {
          settlements.push({
            from: memberNames.get(userB),
            fromId: userB,
            to: memberNames.get(userA),
            toId: userA,
            amount: Math.abs(diff),
          });
        }
      }
    }

    return { balances, settlements };
  }

  // 5. MODO SIMPLIFICADO (Algoritmo Greedy)
  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Number(Math.min(debtor.amount, creditor.amount).toFixed(2));

    if (settleAmount > 0) {
      settlements.push({
        from: debtor.name,
        fromId: debtor.id,
        to: creditor.name,
        toId: creditor.id,
        amount: settleAmount,
      });

      debtor.amount = Number((debtor.amount - settleAmount).toFixed(2));
      creditor.amount = Number((creditor.amount - settleAmount).toFixed(2));
    }

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return { balances, settlements };
};