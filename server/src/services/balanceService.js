/**
 * Calcula los balances individuales y simplifica las transferencias mínimas
 * para saldar las deudas de un proyecto (excluyendo automáticamente gastos personales).
 */
export const calculateBalancesAndDebts = (expenses = [], members = []) => {
  // 1. Inicializar balance en 0 para cada miembro registrado en el proyecto
  const balanceMap = {};
  
  members.forEach((m) => {
    const memberId = String(m?._id || m?.id || m);
    balanceMap[memberId] = {
      user: { 
        id: memberId, 
        name: m?.name || 'Participante', 
        email: m?.email || '' 
      },
      paid: 0,
      owes: 0,
      netBalance: 0
    };
  });

  let totalSharedExpenses = 0;

  // 2. Procesar cada gasto
  expenses.forEach((expense) => {
    // REGLA CLAVE: Los gastos personales NO generan deuda entre los miembros
    if (expense.isPersonal) {
      return;
    }

    const amount = Number(expense.amount || 0);
    if (amount <= 0) return;

    totalSharedExpenses += amount;

    const payerId = String(expense.paidBy?._id || expense.paidBy?.id || expense.paidBy || '');

    if (balanceMap[payerId]) {
      balanceMap[payerId].paid += amount;
    }

    // Reparto entre los participantes designados en el gasto compartido
    if (Array.isArray(expense.splitBetween) && expense.splitBetween.length > 0) {
      expense.splitBetween.forEach((split) => {
        const debtorId = String(split?.user?._id || split?.user?.id || split?.user || split);
        const share = Number(split?.share ?? (amount / expense.splitBetween.length));
        
        if (balanceMap[debtorId]) {
          balanceMap[debtorId].owes += share;
        }
      });
    } else {
      // Fallback: si no hay splitBetween explícito, se divide a partes iguales entre todos los miembros
      const totalMembersCount = members.length || 1;
      const sharePerMember = amount / totalMembersCount;
      
      Object.keys(balanceMap).forEach((memberId) => {
        balanceMap[memberId].owes += sharePerMember;
      });
    }
  });

  // 3. Calcular balance neto (positivo = debe recibir dinero, negativo = debe pagar)
  const balances = Object.values(balanceMap).map((item) => {
    const net = Number((item.paid - item.owes).toFixed(2));
    item.netBalance = net;
    item.paid = Number(item.paid.toFixed(2));
    item.owes = Number(item.owes.toFixed(2));
    return item;
  });

  // 4. Simplificar transacciones (Algoritmo Greedy para mínimas transferencias)
  const debtors = [];   // Los que deben dinero (netBalance < 0)
  const creditors = []; // Los que deben recibir dinero (netBalance > 0)

  balances.forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ ...b, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ ...b, amount: b.netBalance });
    }
  });

  // Ordenar de mayor a menor para optimizar los emparejamientos
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

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
    totalExpenses: Number(totalSharedExpenses.toFixed(2)),
    balances,
    settlements
  };
};