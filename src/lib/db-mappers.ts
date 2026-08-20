import type { Player, Session, SessionPlayer, Transaction, RoundResult } from '@/core/models/domain';

type Row = Record<string, unknown>;

export function rowToPlayer(r: Row): Player {
  return {
    id: r.id as string,
    name: r.name as string,
    avatar: (r.avatar as string | null) ?? undefined,
    createdAt: Number(r.created_at),
  };
}

export function rowToSession(r: Row): Session {
  return {
    id: r.id as string,
    date: Number(r.date),
    location: (r.location as string | null) ?? undefined,
    status: r.status as 'open' | 'closed',
    mode: r.mode as 'real' | 'play',
    currency: r.currency as string,
    rake: Number(r.rake),
    chipRack: (r.chip_rack as Session['chipRack'] | null) ?? undefined,
    createdAt: Number(r.created_at),
    closedAt: r.closed_at != null ? Number(r.closed_at) : undefined,
  };
}

export function rowToSessionPlayer(r: Row): SessionPlayer {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    playerId: r.player_id as string,
    seat: (r.seat as number | null) ?? undefined,
    joinedAt: Number(r.joined_at),
  };
}

export function rowToTransaction(r: Row): Transaction {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    playerId: r.player_id as string,
    type: r.type as Transaction['type'],
    money: Number(r.money),
    chips: Number(r.chips),
    ts: Number(r.ts),
    note: (r.note as string | null) ?? undefined,
  };
}

export function rowToRoundResult(r: Row): RoundResult {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    round: r.round as number,
    bets: r.bets as RoundResult['bets'],
    winnerPlayerId: r.winner_player_id as string,
    ts: Number(r.ts),
  };
}
