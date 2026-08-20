import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToSession } from '@/lib/db-mappers';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rows = await sql`SELECT * FROM sessions WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToSession(rows[0]));
  } catch (e) {
    console.error('[api/sessions/[id] GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { mode, status, closedAt } = await req.json();
    await sql`
      UPDATE sessions
      SET mode      = COALESCE(${mode ?? null}, mode),
          status    = COALESCE(${status ?? null}, status),
          closed_at = COALESCE(${closedAt ?? null}, closed_at)
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/sessions/[id] PATCH]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
