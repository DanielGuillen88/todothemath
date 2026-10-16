/**
 * Calcula los balances individuales y simplifica las transferencias mínimas
 * para saldar las deudas de un proyecto (excluyendo automáticamente gastos personales).
 */
export const calculateBalances = (expenses = [], members = []) => {
  const balanceMap = new Map();

  // 1. Inicializar balance en 0 para cada miembro registrado en el proyecto
  members.forEach((m) => {
    if (!m) return;
    const id = String(m._id || m.id || m);
    const name = m.name || m.email || `Usuario (${id.slice(-4)})`;
    balanceMap.set(id, { id, name, paid: 0, owes: 0, net: 0 });
  });

  // 2. Procesar cada gasto
  expenses.forEach((exp) => {
    if (!exp) return;
    // REGLA CLAVE: Los gastos personales NO generan deuda entre los miembros
    if (exp.isPersonal) return;

    const amount = Number(exp.amount || 0);
    if (amount <= 0) return;

    // Obtener ID del pagador de forma segura
    const payerId = String(exp.paidBy?._id || exp.paidBy?.id || exp.paidBy || '');
    if (payerId && balanceMap.has(payerId)) {
      const payer = balanceMap.get(payerId);
      payer.paid += amount;
    }

    // Reparto entre los participantes designados en el gasto compartido
    if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
      exp.splitBetween.forEach((split) => {
        if (!split) return;
        const userId = String(split.user?._id || split.user?.id || split.user || '');
        const share = Number(split.share) || (amount / exp.splitBetween.length);

        if (userId && balanceMap.has(userId)) {
          const debtor = balanceMap.get(userId);
          debtor.owes += share;
        }
      });
    } else if (members.length > 0) {
      // Reparto equitativo por defecto si splitBetween viniera vacío
      const equalShare = amount / members.length;
      members.forEach((m) => {
        const id = String(m._id || m.id || m);
        if (balanceMap.has(id)) {
          balanceMap.get(id).owes += equalShare;
        }
      });
    }
  });

  // 3. Calcular balance neto (positivo = debe recibir dinero, negativo = debe pagar)
  const balances = [];
  const debtors = [];   // Los que deben dinero (netBalance < 0)
  const creditors = []; // Los que deben recibir dinero (netBalance > 0)

  balanceMap.forEach((entry) => {
    const net = Number((entry.paid - entry.owes).toFixed(2));
    entry.net = net;
    entry.paid = Number(entry.paid.toFixed(2));
    entry.owes = Number(entry.owes.toFixed(2));

    balances.push(entry);

    if (net < -0.01) {
      debtors.push({ ...entry, amount: Math.abs(net) });
    } else if (net > 0.01) {
      creditors.push({ ...entry, amount: net });
    }
  });

  // 4. Simplificar transacciones (Algoritmo Greedy para mínimas transferencias)
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