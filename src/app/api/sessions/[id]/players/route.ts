import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToSessionPlayer } from '@/lib/db-mappers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rows = await sql`SELECT * FROM session_players WHERE session_id = ${id}`;
    return NextResponse.json(rows.map(rowToSessionPlayer));
  } catch (e) {
    console.error('[api/sessions/[id]/players GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: sessionId } = await ctx.params;
    const { id, playerId, seat, joinedAt } = await req.json();
    await sql`
      INSERT INTO session_players (id, session_id, player_id, seat, joined_at)
      VALUES (${id}, ${sessionId}, ${playerId}, ${seat ?? null}, ${joinedAt})
      ON CONFLICT (session_id, player_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[api/sessions/[id]/players POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id: sessionId } = await ctx.params;
    const { playerId } = await req.json();
    await sql`DELETE FROM session_players WHERE session_id = ${sessionId} AND player_id = ${playerId}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/sessions/[id]/players DELETE]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
