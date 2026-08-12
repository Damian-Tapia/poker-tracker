import { describe, it, expect } from 'vitest';
import { selectPlayerLifetimeStats, selectPlayerRoundStats, type PokerState } from '../poker-store';
import type { Session, Transaction, RoundResult } from '../../models/domain';

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  date: 0,
  status: 'closed',
  mode: 'real',
  chipValue: 1,
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
    const s = createSession({ mode: 'play', chipValue: 1 });
    expect(s.mode).toBe('play');
    expect(s.currency).toBe('MXN');
  });

  it('allows changing mode before the first transaction', async () => {
    const { createSession, setSessionMode, getSnapshot } = await import('../poker-store');
    const s = createSession({ mode: 'real', chipValue: 1 });
    setSessionMode(s.id, 'play');
    const updated = getSnapshot().sessions.find((x) => x.id === s.id);
    expect(updated?.mode).toBe('play');
  });

  it('blocks changing mode once a transaction exists', async () => {
    const { createSession, buyIn, setSessionMode } = await import('../poker-store');
    const s = createSession({ mode: 'real', chipValue: 1 });
    buyIn(s.id, 'p1', 100, 100);
    expect(() => setSessionMode(s.id, 'play')).toThrow();
  });
});

describe('recordRound', () => {
  it('auto-increments the round number per session, starting at 1', async () => {
    const { createSession, recordRound } = await import('../poker-store');
    const s = createSession({ mode: 'real', chipValue: 1 });
    const r1 = recordRound(s.id, 'p1', 100);
    const r2 = recordRound(s.id, 'p2', 200);
    expect(r1.round).toBe(1);
    expect(r2.round).toBe(2);
  });

  it('keeps round numbering independent per session', async () => {
    const { createSession, recordRound } = await import('../poker-store');
    const a = createSession({ mode: 'real', chipValue: 1 });
    const b = createSession({ mode: 'real', chipValue: 1 });
    recordRound(a.id, 'p1', 100);
    const bRound = recordRound(b.id, 'p1', 50);
    expect(bRound.round).toBe(1);
  });
});

describe('selectPlayerRoundStats (real vs play split)', () => {
  const round = (overrides: Partial<RoundResult> = {}): RoundResult => ({
    id: 'r1', sessionId: 's1', round: 1, winnerPlayerId: 'p1', potChips: 100, ts: 0, ...overrides,
  });

  it('splits pots won by session mode, never mixed', () => {
    const state: PokerState = {
      players: [], sessionPlayers: [], transactions: [],
      sessions: [
        { id: 'real1', date: 0, status: 'closed', mode: 'real', chipValue: 1, currency: 'MXN', createdAt: 0 },
        { id: 'play1', date: 0, status: 'closed', mode: 'play', chipValue: 1, currency: 'MXN', createdAt: 0 },
      ],
      roundResults: [
        round({ id: 'r1', sessionId: 'real1', winnerPlayerId: 'p1', potChips: 100 }),
        round({ id: 'r2', sessionId: 'play1', winnerPlayerId: 'p1', potChips: 9000 }),
      ],
    };

    const stats = selectPlayerRoundStats(state, 'p1');
    expect(stats.real.roundsWon).toBe(1);
    expect(stats.real.totalPotWon).toBe(100);
    expect(stats.play.roundsWon).toBe(1);
    expect(stats.play.totalPotWon).toBe(9000);
  });
});
