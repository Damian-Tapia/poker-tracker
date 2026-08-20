import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToPlayer, rowToSession, rowToSessionPlayer, rowToTransaction, rowToRoundResult } from '@/lib/db-mappers';

export async function GET() {
  try {
    const [players, sessions, sessionPlayers, transactions, roundResults] = await Promise.all([
      sql`SELECT * FROM players ORDER BY name`,
      sql`SELECT * FROM sessions ORDER BY date DESC`,
      sql`SELECT * FROM session_players`,
      sql`SELECT * FROM transactions ORDER BY ts`,
      sql`SELECT * FROM round_results ORDER BY session_id, round`,
    ]);
    return NextResponse.json({
      players: players.map(rowToPlayer),
      sessions: sessions.map(rowToSession),
      sessionPlayers: sessionPlayers.map(rowToSessionPlayer),
      transactions: transactions.map(rowToTransaction),
      roundResults: roundResults.map(rowToRoundResult),
    });
  } catch (e) {
    console.error('[api/backup GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { replace, players = [], sessions = [], sessionPlayers = [], transactions = [], roundResults = [] } = await req.json();

    if (replace) {
      await sql`TRUNCATE round_results, transactions, session_players, sessions, players CASCADE`;

      for (const p of players) {
        await sql`INSERT INTO players (id, name, avatar, created_at) VALUES (${p.id}, ${p.name}, ${p.avatar ?? null}, ${p.createdAt}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const s of sessions) {
        await sql`INSERT INTO sessions (id, date, location, status, mode, currency, rake, chip_rack, created_at, closed_at) VALUES (${s.id}, ${s.date}, ${s.location ?? null}, ${s.status}, ${s.mode ?? null}, ${s.currency ?? 'MXN'}, ${s.rake ?? 0}, ${s.chipRack ? JSON.stringify(s.chipRack) : null}, ${s.createdAt}, ${s.closedAt ?? null}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const sp of sessionPlayers) {
        await sql`INSERT INTO session_players (id, session_id, player_id, seat, joined_at) VALUES (${sp.id}, ${sp.sessionId}, ${sp.playerId}, ${sp.seat ?? null}, ${sp.joinedAt}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const t of transactions) {
        await sql`INSERT INTO transactions (id, session_id, player_id, type, money, chips, ts, note) VALUES (${t.id}, ${t.sessionId}, ${t.playerId}, ${t.type}, ${t.money}, ${t.chips}, ${t.ts}, ${t.note ?? null}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const r of roundResults) {
        await sql`INSERT INTO round_results (id, session_id, round, bets, winner_player_id, ts) VALUES (${r.id}, ${r.sessionId}, ${r.round}, ${JSON.stringify(r.bets)}, ${r.winnerPlayerId}, ${r.ts}) ON CONFLICT (id) DO NOTHING`;
      }
    } else {
      // merge: upsert each record
      for (const p of players) {
        await sql`INSERT INTO players (id, name, avatar, created_at) VALUES (${p.id}, ${p.name}, ${p.avatar ?? null}, ${p.createdAt}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`;
      }
      for (const s of sessions) {
        await sql`INSERT INTO sessions (id, date, location, status, mode, currency, rake, chip_rack, created_at, closed_at) VALUES (${s.id}, ${s.date}, ${s.location ?? null}, ${s.status}, ${s.mode ?? null}, ${s.currency ?? 'MXN'}, ${s.rake ?? 0}, ${s.chipRack ? JSON.stringify(s.chipRack) : null}, ${s.createdAt}, ${s.closedAt ?? null}) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, mode = EXCLUDED.mode, closed_at = EXCLUDED.closed_at, rake = EXCLUDED.rake, chip_rack = EXCLUDED.chip_rack`;
      }
      for (const sp of sessionPlayers) {
        await sql`INSERT INTO session_players (id, session_id, player_id, seat, joined_at) VALUES (${sp.id}, ${sp.sessionId}, ${sp.playerId}, ${sp.seat ?? null}, ${sp.joinedAt}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const t of transactions) {
        await sql`INSERT INTO transactions (id, session_id, player_id, type, money, chips, ts, note) VALUES (${t.id}, ${t.sessionId}, ${t.playerId}, ${t.type}, ${t.money}, ${t.chips}, ${t.ts}, ${t.note ?? null}) ON CONFLICT (id) DO NOTHING`;
      }
      for (const r of roundResults) {
        await sql`INSERT INTO round_results (id, session_id, round, bets, winner_player_id, ts) VALUES (${r.id}, ${r.sessionId}, ${r.round}, ${JSON.stringify(r.bets)}, ${r.winnerPlayerId}, ${r.ts}) ON CONFLICT (id) DO NOTHING`;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/backup POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
