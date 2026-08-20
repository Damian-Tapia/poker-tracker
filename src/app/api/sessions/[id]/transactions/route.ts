import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToTransaction } from '@/lib/db-mappers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rows = await sql`SELECT * FROM transactions WHERE session_id = ${id} ORDER BY ts`;
    return NextResponse.json(rows.map(rowToTransaction));
  } catch (e) {
    console.error('[api/sessions/[id]/transactions GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: sessionId } = await ctx.params;
    const { id, playerId, type, money, chips, ts, note, newSessionPlayer } = await req.json();

    if (newSessionPlayer) {
      await sql`
        INSERT INTO session_players (id, session_id, player_id, seat, joined_at)
        VALUES (${newSessionPlayer.id}, ${sessionId}, ${newSessionPlayer.playerId}, ${null}, ${newSessionPlayer.joinedAt})
        ON CONFLICT (session_id, player_id) DO NOTHING
      `;
    }

    await sql`
      INSERT INTO transactions (id, session_id, player_id, type, money, chips, ts, note)
      VALUES (${id}, ${sessionId}, ${playerId}, ${type}, ${money}, ${chips}, ${ts}, ${note ?? null})
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[api/sessions/[id]/transactions POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
