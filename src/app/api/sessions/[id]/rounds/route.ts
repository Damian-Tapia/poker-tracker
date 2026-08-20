import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToRoundResult } from '@/lib/db-mappers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rows = await sql`SELECT * FROM round_results WHERE session_id = ${id} ORDER BY round`;
    return NextResponse.json(rows.map(rowToRoundResult));
  } catch (e) {
    console.error('[api/sessions/[id]/rounds GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: sessionId } = await ctx.params;
    const { id, round, bets, winnerPlayerId, ts, transactions = [] } = await req.json();

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO round_results (id, session_id, round, bets, winner_player_id, ts)
        VALUES (${id}, ${sessionId}, ${round}, ${JSON.stringify(bets)}, ${winnerPlayerId}, ${ts})
        ON CONFLICT (id) DO NOTHING
      `;
      for (const t of transactions) {
        await tx`
          INSERT INTO transactions (id, session_id, player_id, type, money, chips, ts, note)
          VALUES (${t.id}, ${sessionId}, ${t.playerId}, ${t.type}, ${t.money}, ${t.chips}, ${t.ts}, ${t.note ?? null})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[api/sessions/[id]/rounds POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
