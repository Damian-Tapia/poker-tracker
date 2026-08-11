// core/logic/settlement.ts
// "Quién le paga a quién" al cerrar la noche, minimizando la cantidad de pagos.

import { PlayerSessionSummary, round2 } from './session-math';

const EPS = 0.005;

export interface Payment {
  fromPlayerId: string; // el que paga (estaba en pérdida)
  toPlayerId: string;   // el que cobra (estaba en ganancia)
  amount: number;
}

/**
 * Algoritmo greedy: empareja al que más debe con el que más tiene a favor.
 * El mínimo teórico de transferencias es NP-hard, pero para una mesa de
 * hogar (<~12 personas) greedy da un resultado más que aceptable y O(n log n).
 */
export function settle(summaries: PlayerSessionSummary[]): Payment[] {
  const debtors = summaries
    .filter((s) => s.net < -EPS)
    .map((s) => ({ id: s.playerId, amt: -s.net })) // cuánto debe
    .sort((a, b) => b.amt - a.amt);

  const creditors = summaries
    .filter((s) => s.net > EPS)
    .map((s) => ({ id: s.playerId, amt: s.net })) // cuánto le deben
    .sort((a, b) => b.amt - a.amt);

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > EPS) {
      payments.push({
        fromPlayerId: debtors[i].id,
        toPlayerId: creditors[j].id,
        amount: round2(pay),
      });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < EPS) i++;
    if (creditors[j].amt < EPS) j++;
  }

  return payments;
}