import { expect } from 'chai';
import { calculateBalancesAndDebts } from '../services/balanceService.js';

const members = [
  { _id: 'user1', name: 'Daniel', email: 'daniel@example.com' },
  { _id: 'user2', name: 'Laura', email: 'laura@example.com' },
  { _id: 'user3', name: 'Carlos', email: 'carlos@example.com' }
];

it('juntamos todos los gastos acumulados y simplificamos todas las deudas en común', () => {
    // Escenario completo:
    // 1. Daniel paga una cena de 90€ para los 3 (30€ c/u).
    // 2. Daniel paga 60€ de compras para él y Laura (30€ c/u).
    // 3. Laura paga 20€ de taxi para ella y Daniel (10€ c/u).
    // 4. Carlos paga 30€ de gasolina para los 3 (10€ c/u).
    const multiExpenses = [
      {
        amount: 90,
        paidBy: { _id: 'user1' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 30 },
          { user: { _id: 'user2' }, share: 30 },
          { user: { _id: 'user3' }, share: 30 }
        ]
      },
      {
        amount: 60,
        paidBy: { _id: 'user1' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 30 },
          { user: { _id: 'user2' }, share: 30 }
        ]
      },
      {
        amount: 20,
        paidBy: { _id: 'user2' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 10 },
          { user: { _id: 'user2' }, share: 10 }
        ]
      },
      {
        amount: 30,
        paidBy: { _id: 'user3' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 10 },
          { user: { _id: 'user2' }, share: 10 },
          { user: { _id: 'user3' }, share: 10 }
        ]
      }
    ];

    const result = calculateBalancesAndDebts(multiExpenses, members);

    console.log('\n--- 📊 Balances Netos Consolidados ---');
    result.balances.forEach((b) => {
      console.log(`👤 ${b.user.name} | Pagó: ${b.paid}€ | Le tocaba: ${b.owes}€ | Balance Neto: ${b.netBalance > 0 ? '+' : ''}${b.netBalance}€`);
    });

    console.log('\n--- 💳 Liquidación Óptima Simplificada ---');
    result.settlements.forEach((s) => {
      console.log(`➡️  ${s.from.name} debe transferir ${s.amount}€ a ${s.to.name}`);
    });
    console.log('-----------------------------------------\n');

    const daniel = result.balances.find((b) => b.user.id === 'user1');
    const laura = result.balances.find((b) => b.user.id === 'user2');
    const carlos = result.balances.find((b) => b.user.id === 'user3');

    // Daniel: pagó 150€, consumió 80€ -> Balance neto +70€
    expect(daniel.netBalance).to.equal(70);
    // Laura: pagó 20€, consumió 80€ -> Balance neto -60€
    expect(laura.netBalance).to.equal(-60);
    // Carlos: pagó 30€, consumió 40€ -> Balance neto -10€
    expect(carlos.netBalance).to.equal(-10);

    // Liquidación simplificada:
    // Laura paga 60€ a Daniel y Carlos paga 10€ a Daniel (total recibido Daniel = 70€)
    expect(result.settlements).to.have.lengthOf(2);
  });