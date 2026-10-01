import { expect } from 'chai';
import { calculateBalancesAndDebts } from '../services/balanceService.js';

// Ejemplo 1: Gasto repartidos entre varios miembros

describe('Balance Service - Cálculos y Liquidación de Deudas', () => {
  const members = [
    { _id: 'user1', name: 'Daniel', email: 'daniel@example.com' },
    { _id: 'user2', name: 'Laura', email: 'laura@example.com' },
    { _id: 'user3', name: 'Carlos', email: 'carlos@example.com' }
  ];

  it('debe calcular correctamente un gasto equitativo entre 3 miembros', () => {
    // Daniel paga 90€ por la cena de los 3 (30€ cada uno)
    const expenses = [
      {
        amount: 90,
        paidBy: { _id: 'user1' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 30 },
          { user: { _id: 'user2' }, share: 30 },
          { user: { _id: 'user3' }, share: 30 }
        ]
      }
    ];

    const result = calculateBalancesAndDebts(expenses, members);

    // console.log('\n--- 💳 Liquidación Caso 1 (Cena 90€) ---');
    // result.settlements.forEach((s) => {
    //   console.log(`➡️  ${s.from.name} debe transferir ${s.amount}€ a ${s.to.name}`);
    // });
    // console.log('----------------------------------------\n');

    expect(result.totalExpenses).to.equal(90);

    const daniel = result.balances.find((b) => b.user.id === 'user1');
    const laura = result.balances.find((b) => b.user.id === 'user2');
    const carlos = result.balances.find((b) => b.user.id === 'user3');

    // Daniel pagó 90 y debe 30 -> Balance neto +60
    expect(daniel.netBalance).to.equal(60);
    // Laura pagó 0 y debe 30 -> Balance neto -30
    expect(laura.netBalance).to.equal(-30);
    // Carlos pagó 0 y debe 30 -> Balance neto -30
    expect(carlos.netBalance).to.equal(-30);

    // Liquidación: Laura y Carlos deben pagar 30 a Daniel
    expect(result.settlements).to.have.lengthOf(2);
    expect(result.settlements[0].amount).to.equal(30);
    expect(result.settlements[1].amount).to.equal(30);
  });

  it('debe simplificar las deudas si dos usuarios pagan gastos cruzados', () => {
    const expenses = [
      // Daniel paga 60€ compartido entre Daniel y Laura (30€ c/u)
      {
        amount: 60,
        paidBy: { _id: 'user1' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 30 },
          { user: { _id: 'user2' }, share: 30 }
        ]
      },
      // Laura paga 20€ compartido entre Daniel y Laura (10€ c/u)
      {
        amount: 20,
        paidBy: { _id: 'user2' },
        splitBetween: [
          { user: { _id: 'user1' }, share: 10 },
          { user: { _id: 'user2' }, share: 10 }
        ]
      }
    ];

    const result = calculateBalancesAndDebts(expenses, [members[0], members[1]]);

    // console.log('\n--- 💳 Liquidación Caso 2 (Gastos cruzados) ---');
    // result.settlements.forEach((s) => {
    //   console.log(`➡️  ${s.from.name} debe transferir ${s.amount}€ a ${s.to.name}`);
    // });
    // console.log('----------------------------------------------\n');

    const daniel = result.balances.find((b) => b.user.id === 'user1');
    const laura = result.balances.find((b) => b.user.id === 'user2');

    // Daniel: pagó 60, debe 40 -> +20
    expect(daniel.netBalance).to.equal(20);
    // Laura: pagó 20, debe 40 -> -20
    expect(laura.netBalance).to.equal(-20);

    // Solo debe haber 1 transferencia simplificada
    expect(result.settlements).to.have.lengthOf(1);
    expect(result.settlements[0].from.id).to.equal('user2');
    expect(result.settlements[0].to.id).to.equal('user1');
    expect(result.settlements[0].amount).to.equal(20);
  });
});