// core/logic/rounds.ts
// Estadística de rondas para la UI. El pozo NUNCA se guarda por separado — se
// deriva siempre de `bets` para que no se pueda desincronizar. El movimiento de
// plata real (crear las transacciones BET/POT_WIN) vive en el store, no acá;
// estas funciones son puramente de lectura/estadística.

import type { RoundResult, RoundBet } from '../models/domain';
import { round2 } from './session-math';

/** El pozo es siempre la suma de las apuestas — nunca partes iguales. */
export function roundPot(bets: RoundBet[]): number {
  return round2(bets.reduce((sum, b) => sum + b.amount, 0));
}

export interface RoundStats {
  count: number;
  totalPot: number;
  avgPot: number;
  biggestPot: number;
}

export function computeRoundStats(rounds: RoundResult[]): RoundStats {
  const count = rounds.length;
  const pots = rounds.map((r) => roundPot(r.bets));
  const totalPot = round2(pots.reduce((a, p) => a + p, 0));
  const avgPot = count > 0 ? round2(totalPot / count) : 0;
  const biggestPot = pots.reduce((a, p) => Math.max(a, p), 0);
  return { count, totalPot, avgPot, biggestPot };
}

export interface PlayerPotStats {
  playerId: string;
  roundsWon: number;
  totalPotWon: number;
  avgPotWon: number;
  biggestPotWon: number;
}

export function computePlayerPotStats(playerId: string, rounds: RoundResult[]): PlayerPotStats {
  const won = rounds.filter((r) => r.winnerPlayerId === playerId);
  const wonPots = won.map((r) => roundPot(r.bets));
  const roundsWon = won.length;
  const totalPotWon = round2(wonPots.reduce((a, p) => a + p, 0));
  const avgPotWon = roundsWon > 0 ? round2(totalPotWon / roundsWon) : 0;
  const biggestPotWon = wonPots.reduce((a, p) => Math.max(a, p), 0);
  return { playerId, roundsWon, totalPotWon, avgPotWon, biggestPotWon };
}
