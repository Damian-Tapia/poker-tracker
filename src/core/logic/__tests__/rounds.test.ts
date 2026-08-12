import { describe, it, expect } from 'vitest';
import { computeRoundStats, computePlayerPotStats, roundPot } from '../rounds';
import type { RoundResult } from '../../models/domain';

const round = (overrides: Partial<RoundResult> = {}): RoundResult => ({
  id: 'r1',
  sessionId: 's1',
  round: 1,
  winnerPlayerId: 'p1',
  bets: [{ playerId: 'p1', amount: 100 }],
  ts: 0,
  ...overrides,
});

describe('roundPot', () => {
  it('sums the bets, uneven amounts included', () => {
    const r = round({ bets: [{ playerId: 'p1', amount: 20 }, { playerId: 'p2', amount: 45 }] });
    expect(roundPot(r)).toBe(65);
  });

  it('returns 0 for a round with no bets', () => {
    expect(roundPot(round({ bets: [] }))).toBe(0);
  });
});

describe('computeRoundStats', () => {
  it('counts rounds, sums pot, averages, and finds the biggest', () => {
    const rounds = [
      round({ id: 'r1', bets: [{ playerId: 'p1', amount: 100 }] }),
      round({ id: 'r2', bets: [{ playerId: 'p1', amount: 300 }] }),
      round({ id: 'r3', bets: [{ playerId: 'p1', amount: 200 }] }),
    ];
    const stats = computeRoundStats(rounds);
    expect(stats.count).toBe(3);
    expect(stats.totalPot).toBe(600);
    expect(stats.avgPot).toBe(200);
    expect(stats.biggestPot).toBe(300);
  });

  it('returns zeros for no rounds', () => {
    const stats = computeRoundStats([]);
    expect(stats).toEqual({ count: 0, totalPot: 0, avgPot: 0, biggestPot: 0 });
  });

  it('treats an empty bets array as a zero pot', () => {
    const rounds = [round({ id: 'r1', bets: [] })];
    const stats = computeRoundStats(rounds);
    expect(stats.totalPot).toBe(0);
    expect(stats.avgPot).toBe(0);
  });

  it('sums uneven bets correctly, not split evenly', () => {
    const rounds = [round({ id: 'r1', bets: [{ playerId: 'p1', amount: 10 }, { playerId: 'p2', amount: 90 }] })];
    const stats = computeRoundStats(rounds);
    expect(stats.totalPot).toBe(100);
  });
});

describe('computePlayerPotStats', () => {
  it('only counts rounds the player won', () => {
    const rounds = [
      round({ id: 'r1', winnerPlayerId: 'p1', bets: [{ playerId: 'p1', amount: 100 }] }),
      round({ id: 'r2', winnerPlayerId: 'p2', bets: [{ playerId: 'p2', amount: 500 }] }),
      round({ id: 'r3', winnerPlayerId: 'p1', bets: [{ playerId: 'p1', amount: 300 }] }),
    ];
    const stats = computePlayerPotStats('p1', rounds);
    expect(stats.roundsWon).toBe(2);
    expect(stats.totalPotWon).toBe(400);
    expect(stats.avgPotWon).toBe(200);
    expect(stats.biggestPotWon).toBe(300);
  });

  it('returns zeros for a player with no wins', () => {
    const rounds = [round({ id: 'r1', winnerPlayerId: 'p2', bets: [{ playerId: 'p2', amount: 500 }] })];
    const stats = computePlayerPotStats('p1', rounds);
    expect(stats).toEqual({ playerId: 'p1', roundsWon: 0, totalPotWon: 0, avgPotWon: 0, biggestPotWon: 0 });
  });
});
