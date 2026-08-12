// core/logic/session-math.ts
// Lógica PURA de plata. Sin Angular, sin Dexie. Fácil de testear.

import { Transaction, Session } from '../models/domain';

const EPS = 0.005; // tolerancia para comparaciones de dinero (medio centavo)

export interface PlayerSessionSummary {
  playerId: string;
  buyInMoney: number;   // BUY_IN + REBUY (lo que puso en juego)
  cashoutMoney: number; // CASHOUT (lo que se llevó)
  betMoney: number;     // BET (lo que apostó en rondas)
  potWinMoney: number;  // POT_WIN (lo que ganó en pozos)
  net: number;          // cashout - buyIn (su ganancia/pérdida REALIZADA de la noche)
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
  let betMoney = 0;
  let potWinMoney = 0;
  let buyInChips = 0;
  let cashoutChips = 0;

  for (const t of txs) {
    if (t.playerId !== playerId) continue;
    switch (t.type) {
      case 'CASHOUT':
        cashoutMoney += t.money;
        cashoutChips += t.chips;
        break;
      case 'BET':
        betMoney += t.money;
        break;
      case 'POT_WIN':
        potWinMoney += t.money;
        break;
      default: // BUY_IN | REBUY
        buyInMoney += t.money;
        buyInChips += t.chips;
        break;
    }
  }

  return {
    playerId,
    buyInMoney,
    cashoutMoney,
    betMoney,
    potWinMoney,
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
  netSum: number;
}

/**
 * Chequea que la sesión cierre "cuadrada".
 * En cash game el dinero se conserva: la suma de todos los net debe dar 0
 * (o -rake si el host se llevó un corte). Si no, hay un error de carga —
 * típicamente, algún jugador todavía no hizo cash-out.
 *
 * Nota: ya no se chequea conservación de fichas físicas. El cash-out ahora se
 * calcula solo (buy-in − apostado + ganado en pozos), no se cuentan fichas a
 * mano, así que ese chequeo dejó de tener sentido.
 */
export function checkIntegrity(
  summaries: PlayerSessionSummary[],
  session: Session,
): SessionIntegrity {
  const netSum = summaries.reduce((a, s) => a + s.net, 0);
  const rake = session.rake ?? 0;

  return {
    moneyBalanced: Math.abs(netSum + rake) < EPS,
    netSum,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function chipsInPlay(summary: PlayerSessionSummary): number {
  return summary.buyInChips - summary.cashoutChips;
}

/**
 * Cuánto tiene el jugador EN JUEGO ahora mismo: buy-in menos lo apostado más
 * lo ganado en pozos. Es lo que se usa como monto de cash-out cuando se retira
 * (no se cuentan fichas a mano).
 */
export function currentStack(summary: PlayerSessionSummary): number {
  return round2(summary.buyInMoney - summary.betMoney + summary.potWinMoney);
}

/** El modo real/play se puede cambiar solo antes de la primera transacción de la sesión. */
export function canChangeSessionMode(txs: Transaction[]): boolean {
  return txs.length === 0;
}