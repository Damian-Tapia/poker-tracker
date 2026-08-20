import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const { name, avatar } = await req.json();
    await sql`
      UPDATE players
      SET name   = COALESCE(${name ?? null}, name),
          avatar = COALESCE(${avatar ?? null}, avatar)
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/players/[id] PUT]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await sql`DELETE FROM players WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/players/[id] DELETE]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
