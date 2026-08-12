// core/logic/rounds.ts
// Estadística de rondas. Informativa, 100% desacoplada de settlement/session-math.

import type { RoundResult } from '../models/domain';
import { round2 } from './session-math';

export interface RoundStats {
  count: number;
  totalPot: number;
  avgPot: number;
  biggestPot: number;
}

export function computeRoundStats(rounds: RoundResult[]): RoundStats {
  const count = rounds.length;
  const totalPot = round2(rounds.reduce((a, r) => a + (r.potChips ?? 0), 0));
  const avgPot = count > 0 ? round2(totalPot / count) : 0;
  const biggestPot = rounds.reduce((a, r) => Math.max(a, r.potChips ?? 0), 0);
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
  const roundsWon = won.length;
  const totalPotWon = round2(won.reduce((a, r) => a + (r.potChips ?? 0), 0));
  const avgPotWon = roundsWon > 0 ? round2(totalPotWon / roundsWon) : 0;
  const biggestPotWon = won.reduce((a, r) => Math.max(a, r.potChips ?? 0), 0);
  return { playerId, roundsWon, totalPotWon, avgPotWon, biggestPotWon };
}
