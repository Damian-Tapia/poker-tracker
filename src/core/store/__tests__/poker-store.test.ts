import { describe, it, expect } from 'vitest';
import { selectPlayerLifetimeStats, selectPlayerRoundStats, type PokerState } from '../poker-store';
import type { Session, Transaction, RoundResult } from '../../models/domain';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  date: 0,
  status: 'closed',
  mode: 'real',
  currency: 'MXN',
  rake: 0,
  createdAt: 0,
  ...overrides,
});

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  sessionId: 's1',
  playerId: 'p1',
  type: 'BUY_IN',
  money: 100,
  chips: 100,
  ts: 0,
  ...overrides,
});

const emptyState = (): PokerState => ({
  players: [],
  sessions: [],
  sessionPlayers: [],
  transactions: [],
  roundResults: [],
});

describe('selectPlayerLifetimeStats (real vs play split)', () => {
  it('keeps a real-money session out of the play bucket', () => {
    const state = emptyState();
    state.sessions = [session({ id: 'real1', mode: 'real' })];
    state.transactions = [
      tx({ id: 't1', sessionId: 'real1', type: 'BUY_IN', money: 100 }),
      tx({ id: 't2', sessionId: 'real1', type: 'CASHOUT', money: 150 }),
    ];

    const stats = selectPlayerLifetimeStats(state, 'p1');
    expect(stats.real.sessionsPlayed).toBe(1);
    expect(stats.real.net).toBe(50);
    expect(stats.play.sessionsPlayed).toBe(0);
    expect(stats.play.net).toBe(0);
  });

  it('keeps a play-money session out of the real bucket', () => {
    const state = emptyState();
    state.sessions = [session({ id: 'play1', mode: 'play' })];
    state.transactions = [
      tx({ id: 't1', sessionId: 'play1', type: 'BUY_IN', money: 100 }),
      tx({ id: 't2', sessionId: 'play1', type: 'CASHOUT', money: 40 }),
    ];

    const stats = selectPlayerLifetimeStats(state, 'p1');
    expect(stats.play.sessionsPlayed).toBe(1);
    expect(stats.play.net).toBe(-60);
    expect(stats.real.sessionsPlayed).toBe(0);
    expect(stats.real.net).toBe(0);
  });

  it('never sums real and play nets into a single number', () => {
    const state = emptyState();
    state.sessions = [
      session({ id: 'real1', mode: 'real' }),
      session({ id: 'play1', mode: 'play' }),
    ];
    state.transactions = [
      tx({ id: 't1', sessionId: 'real1', type: 'BUY_IN', money: 100 }),
      tx({ id: 't2', sessionId: 'real1', type: 'CASHOUT', money: 130 }),
      tx({ id: 't3', sessionId: 'play1', type: 'BUY_IN', money: 1000 }),
      tx({ id: 't4', sessionId: 'play1', type: 'CASHOUT', money: 5000 }),
    ];

    const stats = selectPlayerLifetimeStats(state, 'p1');
    expect(stats.real.net).toBe(30);
    expect(stats.play.net).toBe(4000);
    expect(stats.real.sessionsPlayed).toBe(1);
    expect(stats.play.sessionsPlayed).toBe(1);
  });

  it('ignores open (not yet closed) sessions in both buckets', () => {
    const state = emptyState();
    state.sessions = [session({ id: 'open1', mode: 'real', status: 'open' })];
    state.transactions = [tx({ id: 't1', sessionId: 'open1', type: 'BUY_IN', money: 100 })];

    const stats = selectPlayerLifetimeStats(state, 'p1');
    expect(stats.real.sessionsPlayed).toBe(0);
    expect(stats.play.sessionsPlayed).toBe(0);
  });

  it('returns zeroed stats for both buckets when player has no history', () => {
    const stats = selectPlayerLifetimeStats(emptyState(), 'ghost');
    expect(stats.real.sessionsPlayed).toBe(0);
    expect(stats.real.net).toBe(0);
    expect(stats.play.sessionsPlayed).toBe(0);
    expect(stats.play.net).toBe(0);
  });
});

describe('createSession / setSessionMode', () => {
  it('createSession stores the chosen mode and hardcodes currency to MXN', async () => {
    const { createSession } = await import('../poker-store');
    const s = createSession({ mode: 'play' });
    expect(s.mode).toBe('play');
    expect(s.currency).toBe('MXN');
  });

  it('allows changing mode before the first transaction', async () => {
    const { createSession, setSessionMode, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    setSessionMode(s.id, 'play');
    const updated = getSnapshot().sessions.find((x) => x.id === s.id);
    expect(updated?.mode).toBe('play');
  });

  it('blocks changing mode once a transaction exists', async () => {
    const { createSession, buyIn, setSessionMode } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    buyIn(s.id, 'p1', 100, 100);
    expect(() => setSessionMode(s.id, 'play')).toThrow();
  });
});

describe('cashout', () => {
  it('stores the provided money amount, chips always 0', async () => {
    const { createSession, buyIn, cashout, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    buyIn(s.id, 'p1', 100, 0);
    const tx = cashout(s.id, 'p1', 150);
    expect(tx.money).toBe(150);
    expect(tx.chips).toBe(0);
    expect(getSnapshot().transactions.find((t) => t.id === tx.id)?.type).toBe('CASHOUT');
  });
});

describe('recordRound', () => {
  it('creates a BET transaction per bettor and a POT_WIN transaction for the winner', async () => {
    const { createSession, recordRound, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    recordRound(s.id, [{ playerId: 'p1', amount: 20 }, { playerId: 'p2', amount: 30 }], 'p2');

    const txs = getSnapshot().transactions.filter((t) => t.sessionId === s.id);
    const bets = txs.filter((t) => t.type === 'BET');
    const potWins = txs.filter((t) => t.type === 'POT_WIN');
    expect(bets).toHaveLength(2);
    expect(bets.every((t) => t.chips === 0)).toBe(true);
    expect(potWins).toHaveLength(1);
    expect(potWins[0].playerId).toBe('p2');
    expect(potWins[0].money).toBe(50); // sum of bets, not split evenly
  });

  it('does not split the pot evenly — uneven bets stay uneven', async () => {
    const { createSession, recordRound, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    recordRound(s.id, [{ playerId: 'p1', amount: 10 }, { playerId: 'p2', amount: 90 }], 'p1');
    const bets = getSnapshot().transactions.filter((t) => t.sessionId === s.id && t.type === 'BET');
    expect(bets.find((t) => t.playerId === 'p1')?.money).toBe(10);
    expect(bets.find((t) => t.playerId === 'p2')?.money).toBe(90);
  });

  it('skips zero-amount bets and creates no transactions for a pot of 0', async () => {
    const { createSession, recordRound, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    recordRound(s.id, [{ playerId: 'p1', amount: 0 }], 'p1');
    const txs = getSnapshot().transactions.filter((t) => t.sessionId === s.id);
    expect(txs).toHaveLength(0);
  });

  it('auto-increments the round number per session, starting at 1', async () => {
    const { createSession, recordRound } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    const r1 = recordRound(s.id, [{ playerId: 'p1', amount: 10 }], 'p1');
    const r2 = recordRound(s.id, [{ playerId: 'p2', amount: 20 }], 'p2');
    expect(r1.round).toBe(1);
    expect(r2.round).toBe(2);
  });

  it('keeps round numbering independent per session', async () => {
    const { createSession, recordRound } = await import('../poker-store');
    const a = createSession({ mode: 'real' });
    const b = createSession({ mode: 'real' });
    recordRound(a.id, [{ playerId: 'p1', amount: 100 }], 'p1');
    const bRound = recordRound(b.id, [{ playerId: 'p1', amount: 50 }], 'p1');
    expect(bRound.round).toBe(1);
  });

  it('locks the session mode, same as any other transaction', async () => {
    const { createSession, recordRound, setSessionMode } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    recordRound(s.id, [{ playerId: 'p1', amount: 10 }], 'p1');
    expect(() => setSessionMode(s.id, 'play')).toThrow();
  });
});

describe('a full round never breaks moneyBalanced at close', () => {
  it('buy-in, bet, pot win, cash-out all round-trip to a balanced close', async () => {
    const { createSession, buyIn, recordRound, cashout, closeSession, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real' });
    buyIn(s.id, 'p1', 100, 100);
    buyIn(s.id, 'p2', 100, 100);
    recordRound(s.id, [{ playerId: 'p1', amount: 20 }, { playerId: 'p2', amount: 20 }], 'p1');
    cashout(s.id, 'p1', 120); // 100 buyin - 20 bet + 40 pot win
    cashout(s.id, 'p2', 80);  // 100 buyin - 20 bet
    expect(() => closeSession(s.id)).not.toThrow();
    expect(getSnapshot().sessions.find((x) => x.id === s.id)?.status).toBe('closed');
  });
});

describe('selectPlayerRoundStats (real vs play split)', () => {
  const round = (overrides: Partial<RoundResult> = {}): RoundResult => ({
    id: 'r1', sessionId: 's1', round: 1, winnerPlayerId: 'p1', bets: [{ playerId: 'p1', amount: 100 }], ts: 0, ...overrides,
  });

  it('splits pots won by session mode, never mixed', () => {
    const state: PokerState = {
      players: [], sessionPlayers: [], transactions: [],
      sessions: [
        { id: 'real1', date: 0, status: 'closed', mode: 'real', currency: 'MXN', createdAt: 0 },
        { id: 'play1', date: 0, status: 'closed', mode: 'play', currency: 'MXN', createdAt: 0 },
      ],
      roundResults: [
        round({ id: 'r1', sessionId: 'real1', winnerPlayerId: 'p1', bets: [{ playerId: 'p1', amount: 100 }] }),
        round({ id: 'r2', sessionId: 'play1', winnerPlayerId: 'p1', bets: [{ playerId: 'p1', amount: 9000 }] }),
      ],
    };

    const stats = selectPlayerRoundStats(state, 'p1');
    expect(stats.real.roundsWon).toBe(1);
    expect(stats.real.totalPotWon).toBe(100);
    expect(stats.play.roundsWon).toBe(1);
    expect(stats.play.totalPotWon).toBe(9000);
  });
});
