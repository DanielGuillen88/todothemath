/**
 * Motor P2P estricto: Deuda bilateral transparente entre quien consume y quien pagó,
 * descontando los pagos directos registrados en Settlement.
 */
export const calculateBalances = (expenses = [], settlementsList = [], members = []) => {
  const balanceMap = new Map();
  const memberNames = new Map();

  // 1. Inicializar miembros
  members.forEach((m) => {
    if (!m) return;
    const id = String(m._id || m.id || m);
    const name = m.name || m.email || `Usuario (${id.slice(-4)})`;
    balanceMap.set(id, { 
      id, 
      name, 
      paid: 0, 
      owes: 0, 
      settledPaid: 0, 
      settledReceived: 0, 
      net: 0 
    });
    memberNames.set(id, name);
  });

  // Mapa de deudas directas: directDebts[deudor][acreedor] = suma acumulada
  const directDebts = new Map();

  const addDebt = (debtorId, creditorId, amount) => {
    if (!debtorId || !creditorId || debtorId === creditorId || amount === 0) return;
    if (!directDebts.has(debtorId)) directDebts.set(debtorId, new Map());
    const m = directDebts.get(debtorId);
    m.set(creditorId, (m.get(creditorId) || 0) + amount);
  };

  // 2. Procesar compras ordinarias
  expenses.forEach((exp) => {
    if (!exp || exp.isPersonal || exp.isSettlement) return;
    const amount = Number(exp.amount || 0);
    if (amount <= 0) return;

    const payerId = String(exp.paidBy?._id || exp.paidBy?.id || exp.paidBy || '');
    if (payerId && balanceMap.has(payerId)) {
      balanceMap.get(payerId).paid += amount;
    }

    // Reparto explícito: solo asumen deuda quienes figuran en splitBetween
    if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
      exp.splitBetween.forEach((split) => {
        if (!split) return;
        const userId = String(split.user?._id || split.user?.id || split.user || '');

        const share = split.share !== undefined && split.share !== null && !isNaN(Number(split.share))
          ? Number(split.share)
          : Number((amount / exp.splitBetween.length).toFixed(2));

        if (userId && balanceMap.has(userId)) {
          balanceMap.get(userId).owes += share;
          if (payerId && userId !== payerId) {
            addDebt(userId, payerId, share);
          }
        }
      });
    } else if (members.length > 0) {
      // Fallback de compatibilidad: reparto equitativo si no hubo selección previa
      const equalShare = Number((amount / members.length).toFixed(2));
      members.forEach((m) => {
        const id = String(m._id || m.id || m);
        if (balanceMap.has(id)) {
          balanceMap.get(id).owes += equalShare;
          if (payerId && id !== payerId) {
            addDebt(id, payerId, equalShare);
          }
        }
      });
    }
  });

  // 3. Aplicar liquidaciones registradas (Settlement)
  settlementsList.forEach((st) => {
    const fromId = String(st.from?._id || st.from?.id || st.from || '');
    const toId = String(st.to?._id || st.to?.id || st.to || '');
    const amount = Number(st.amount || 0);

    if (fromId && toId && amount > 0) {
      addDebt(fromId, toId, -amount);

      if (balanceMap.has(fromId)) balanceMap.get(fromId).settledPaid += amount;
      if (balanceMap.has(toId)) balanceMap.get(toId).settledReceived += amount;
    }
  });

  // 4. Balances netos individuales
  const balances = [];
  balanceMap.forEach((entry) => {
    const effectivePaid = entry.paid + entry.settledPaid;
    const effectiveOwed = entry.owes + entry.settledReceived;

    entry.net = Number((effectivePaid - effectiveOwed).toFixed(2));
    entry.paid = Number(entry.paid.toFixed(2));
    entry.owes = Number(entry.owes.toFixed(2));
    entry.settledPaid = Number(entry.settledPaid.toFixed(2));
    entry.settledReceived = Number(entry.settledReceived.toFixed(2));

    balances.push(entry);
  });

  // 5. Liquidaciones pendientes bilaterales P2P
  const settlements = [];
  const memberIds = Array.from(balanceMap.keys());

  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const uA = memberIds[i];
      const uB = memberIds[j];

      const aOwesB = directDebts.get(uA)?.get(uB) || 0;
      const bOwesA = directDebts.get(uB)?.get(uA) || 0;
      const diff = Number((aOwesB - bOwesA).toFixed(2));

      if (diff > 0.01) {
        settlements.push({
          from: memberNames.get(uA),
          fromId: uA,
          to: memberNames.get(uB),
          toId: uB,
          amount: diff,
        });
      } else if (diff < -0.01) {
        settlements.push({
          from: memberNames.get(uB),
          fromId: uB,
          to: memberNames.get(uA),
          toId: uA,
          amount: Math.abs(diff),
        });
      }
    }
  }

  return { balances, settlements };
};