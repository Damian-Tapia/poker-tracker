import { describe, it, expect } from 'vitest';
import {
  summarizePlayer,
  summarizeSession,
  checkIntegrity,
  round2,
  chipsInPlay,
  canChangeSessionMode,
} from '../session-math';
import type { Transaction, Session } from '../../models/domain';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  date: 0,
  status: 'open',
  mode: 'real',
  currency: 'MXN',
  rake: 0,
  createdAt: 0,
  ...overrides,
});

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 't1',
  sessionId: 's1',
  playerId: 'p1',
  type: 'BUY_IN',
  money: 100,
  chips: 100,
  ts: 0,
  ...overrides,
});

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(2.999)).toBe(3);
    expect(round2(0)).toBe(0);
  });
});

describe('chipsInPlay', () => {
  it('returns buyInChips minus cashoutChips', () => {
    const summary = { playerId: 'p1', buyInMoney: 100, cashoutMoney: 0, net: -100, buyInChips: 100, cashoutChips: 40 };
    expect(chipsInPlay(summary)).toBe(60);
  });
});

describe('summarizePlayer', () => {
  it('simple buy-in and cashout', () => {
    const txs = [
      tx({ type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', type: 'CASHOUT', money: 130, chips: 130 }),
    ];
    const s = summarizePlayer('p1', txs);
    expect(s.buyInMoney).toBe(100);
    expect(s.cashoutMoney).toBe(130);
    expect(s.net).toBe(30);
  });

  it('accumulates multiple rebuys', () => {
    const txs = [
      tx({ id: 't1', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', type: 'REBUY', money: 50, chips: 50 }),
      tx({ id: 't3', type: 'REBUY', money: 50, chips: 50 }),
      tx({ id: 't4', type: 'CASHOUT', money: 180, chips: 180 }),
    ];
    const s = summarizePlayer('p1', txs);
    expect(s.buyInMoney).toBe(200);
    expect(s.cashoutMoney).toBe(180);
    expect(s.net).toBe(-20);
  });

  it('ignores transactions from other players', () => {
    const txs = [
      tx({ id: 't1', playerId: 'p1', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', playerId: 'p2', type: 'BUY_IN', money: 200, chips: 200 }),
      tx({ id: 't3', playerId: 'p1', type: 'CASHOUT', money: 100, chips: 100 }),
    ];
    const s = summarizePlayer('p1', txs);
    expect(s.buyInMoney).toBe(100);
    expect(s.cashoutMoney).toBe(100);
    expect(s.net).toBe(0);
  });

  it('returns zeros for player with no transactions', () => {
    const s = summarizePlayer('p99', []);
    expect(s.buyInMoney).toBe(0);
    expect(s.cashoutMoney).toBe(0);
    expect(s.net).toBe(0);
  });
});

describe('checkIntegrity', () => {
  it('balanced session without rake', () => {
    const txs = [
      tx({ id: 't1', playerId: 'p1', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', playerId: 'p2', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't3', playerId: 'p1', type: 'CASHOUT', money: 130, chips: 130 }),
      tx({ id: 't4', playerId: 'p2', type: 'CASHOUT', money: 70, chips: 70 }),
    ];
    const summaries = summarizeSession(txs);
    const result = checkIntegrity(summaries, session());
    expect(result.moneyBalanced).toBe(true);
    expect(result.chipsBalanced).toBe(true);
  });

  it('balanced session with rake', () => {
    const txs = [
      tx({ id: 't1', playerId: 'p1', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', playerId: 'p2', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't3', playerId: 'p1', type: 'CASHOUT', money: 125, chips: 125 }),
      tx({ id: 't4', playerId: 'p2', type: 'CASHOUT', money: 65, chips: 65 }),
    ];
    const summaries = summarizeSession(txs);
    const result = checkIntegrity(summaries, session({ rake: 10 }));
    expect(result.moneyBalanced).toBe(true);
    expect(result.chipsBalanced).toBe(false);
  });

  it('unbalanced session detected', () => {
    const txs = [
      tx({ id: 't1', playerId: 'p1', type: 'BUY_IN', money: 100, chips: 100 }),
      tx({ id: 't2', playerId: 'p1', type: 'CASHOUT', money: 120, chips: 120 }),
    ];
    const summaries = summarizeSession(txs);
    const result = checkIntegrity(summaries, session());
    expect(result.moneyBalanced).toBe(false);
    expect(result.netSum).toBeCloseTo(20, 5);
  });

  it('tolerates floating point rounding errors', () => {
    const txs = [
      tx({ id: 't1', playerId: 'p1', type: 'BUY_IN', money: 100.001, chips: 100 }),
      tx({ id: 't2', playerId: 'p1', type: 'CASHOUT', money: 100, chips: 100 }),
    ];
    const summaries = summarizeSession(txs);
    const result = checkIntegrity(summaries, session());
    expect(result.moneyBalanced).toBe(true);
  });
});

describe('canChangeSessionMode', () => {
  it('allows changing mode when the session has no transactions', () => {
    expect(canChangeSessionMode([])).toBe(true);
  });

  it('blocks changing mode once any transaction exists', () => {
    const txs = [tx({ type: 'BUY_IN' })];
    expect(canChangeSessionMode(txs)).toBe(false);
  });

  it('blocks even for a single rebuy or cashout', () => {
    expect(canChangeSessionMode([tx({ type: 'CASHOUT' })])).toBe(false);
  });
});
