import { describe, it, expect } from 'vitest';
import { settle } from '../settlement';
import type { PlayerSessionSummary } from '../session-math';

const s = (playerId: string, net: number): PlayerSessionSummary => ({
  playerId,
  buyInMoney: net < 0 ? -net : 0,
  cashoutMoney: net > 0 ? net : 0,
  betMoney: 0,
  potWinMoney: 0,
  net,
  buyInChips: 0,
  cashoutChips: 0,
});

describe('settle', () => {
  it('single debtor pays single creditor', () => {
    const payments = settle([s('alice', 50), s('bob', -50)]);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ fromPlayerId: 'bob', toPlayerId: 'alice', amount: 50 });
  });

  it('ignores players near zero', () => {
    const payments = settle([s('alice', 0.001), s('bob', -0.001), s('carol', 0)]);
    expect(payments).toHaveLength(0);
  });

  it('multiple debtors settle to zero', () => {
    const summaries = [s('alice', 100), s('bob', -60), s('carol', -40)];
    const payments = settle(summaries);
    const totalPaid = payments.reduce((a, p) => a + p.amount, 0);
    expect(totalPaid).toBeCloseTo(100, 2);
    expect(payments.every((p) => p.amount > 0)).toBe(true);
  });

  it('one large creditor collects from multiple small debtors', () => {
    const summaries = [s('big', 90), s('a', -30), s('b', -30), s('c', -30)];
    const payments = settle(summaries);
    const totalTowardsBig = payments.filter((p) => p.toPlayerId === 'big').reduce((a, p) => a + p.amount, 0);
    expect(totalTowardsBig).toBeCloseTo(90, 2);
  });

  it('rounds amounts to cents', () => {
    const summaries = [s('alice', 1 / 3), s('bob', -(1 / 3))];
    const payments = settle(summaries);
    payments.forEach((p) => {
      expect(p.amount).toBe(Math.round(p.amount * 100) / 100);
    });
  });

  it('payment count bounded by debtors + creditors - 1', () => {
    const summaries = [s('a', 50), s('b', 50), s('c', -30), s('d', -30), s('e', -40)];
    const payments = settle(summaries);
    const debtors = summaries.filter((x) => x.net < -0.005).length;
    const creditors = summaries.filter((x) => x.net > 0.005).length;
    expect(payments.length).toBeLessThanOrEqual(debtors + creditors - 1);
  });

  it('returns empty for empty summaries', () => {
    expect(settle([])).toHaveLength(0);
  });

  it('returns empty when all players break even', () => {
    const payments = settle([s('alice', 0), s('bob', 0)]);
    expect(payments).toHaveLength(0);
  });
});
