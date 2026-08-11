// core/logic/session-math.ts
// Lógica PURA de plata. Sin Angular, sin Dexie. Fácil de testear.

import { Transaction, Session } from '../models/domain';

const EPS = 0.005; // tolerancia para comparaciones de dinero (medio centavo)

export interface PlayerSessionSummary {
  playerId: string;
  buyInMoney: number;   // BUY_IN + REBUY (lo que puso en juego)
  cashoutMoney: number; // CASHOUT (lo que se llevó)
  net: number;          // cashout - buyIn (su ganancia/pérdida de la noche)
  buyInChips: number;
  cashoutChips: number;
}

/** Resume a un solo jugador a partir de sus transacciones. */
export function summarizePlayer(
  playerId: string,
  txs: Transaction[],
): PlayerSessionSummary {
  let buyInMoney = 0;
  let cashoutMoney = 0;
  let buyInChips = 0;
  let cashoutChips = 0;

  for (const t of txs) {
    if (t.playerId !== playerId) continue;
    if (t.type === 'CASHOUT') {
      cashoutMoney += t.money;
      cashoutChips += t.chips;
    } else {
      buyInMoney += t.money;
      buyInChips += t.chips;
    }
  }

  return {
    playerId,
    buyInMoney,
    cashoutMoney,
    net: cashoutMoney - buyInMoney,
    buyInChips,
    cashoutChips,
  };
}

/** Resume a todos los jugadores presentes en un set de transacciones. */
export function summarizeSession(txs: Transaction[]): PlayerSessionSummary[] {
  const ids = [...new Set(txs.map((t) => t.playerId))];
  return ids.map((id) => summarizePlayer(id, txs));
}

export interface SessionIntegrity {
  moneyBalanced: boolean; // Σ net ≈ -rake  (el dinero se conserva)
  chipsBalanced: boolean; // fichas que entran == fichas que salen
  netSum: number;
  chipDelta: number;      // buyInChips total - cashoutChips total
}

/**
 * Chequea que la sesión cierre "cuadrada".
 * En cash game el dinero se conserva: la suma de todos los net debe dar 0
 * (o -rake si el host se llevó un corte). Si no, hay un error de carga.
 */
export function checkIntegrity(
  summaries: PlayerSessionSummary[],
  session: Session,
): SessionIntegrity {
  const netSum = summaries.reduce((a, s) => a + s.net, 0);
  const rake = session.rake ?? 0;
  const chipIn = summaries.reduce((a, s) => a + s.buyInChips, 0);
  const chipOut = summaries.reduce((a, s) => a + s.cashoutChips, 0);

  return {
    moneyBalanced: Math.abs(netSum + rake) < EPS,
    chipsBalanced: Math.abs(chipIn - chipOut) < EPS,
    netSum,
    chipDelta: chipIn - chipOut,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function chipsInPlay(summary: PlayerSessionSummary): number {
  return summary.buyInChips - summary.cashoutChips;
}

export function moneyForChips(chips: number, chipValue: number): number {
  return round2(chips * chipValue);
}