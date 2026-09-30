/**
 * Calcula los balances individuales y simplifica las transferencias mínimas
 * para saldar las deudas de un proyecto.
 */
export const calculateBalancesAndDebts = (expenses, members) => {
  // 1. Inicializar balance en 0 para cada miembro registrado en el proyecto
  const balanceMap = {};
  members.forEach((m) => {
    balanceMap[m._id.toString()] = {
      user: { id: m._id, name: m.name, email: m.email },
      paid: 0,
      owes: 0,
      netBalance: 0
    };
  });

  let totalExpenses = 0;

  // 2. Procesar cada gasto
  expenses.forEach((expense) => {
    totalExpenses += expense.amount;
    const payerId = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();

    if (balanceMap[payerId]) {
      balanceMap[payerId].paid += expense.amount;
    }

    // Reparto entre los participantes designados en el gasto
    expense.splitBetween.forEach((split) => {
      const debtorId = split.user._id ? split.user._id.toString() : split.user.toString();
      if (balanceMap[debtorId]) {
        balanceMap[debtorId].owes += split.share;
      }
    });
  });

  // 3. Calcular balance neto (positivo = recibe dinero, negativo = debe pagar)
  const balances = Object.values(balanceMap).map((item) => {
    const net = Number((item.paid - item.owes).toFixed(2));
    item.netBalance = net;
    item.paid = Number(item.paid.toFixed(2));
    item.owes = Number(item.owes.toFixed(2));
    return item;
  });

  // 4. Calcula balance final y asi evitar transacciones innecesarias
  const debtors = [];  // Los que deben dinero (balance < 0)
  const creditors = []; // Los que deben recibir dinero (balance > 0)

  balances.forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ ...b, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ ...b, amount: b.netBalance });
    }
  });

  const settlements = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Number(settlementAmount.toFixed(2));

    if (roundedAmount > 0) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedAmount
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return {
    totalExpenses: Number(totalExpenses.toFixed(2)),
    balances,
    settlements
  };
};