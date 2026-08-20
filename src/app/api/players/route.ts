import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToPlayer } from '@/lib/db-mappers';

export async function GET() {
  try {
    const rows = await sql`SELECT id, name, avatar, created_at FROM players ORDER BY name`;
    return NextResponse.json(rows.map(rowToPlayer));
  } catch (e) {
    console.error('[api/players GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, name, avatar, createdAt } = await req.json();
    await sql`
      INSERT INTO players (id, name, avatar, created_at)
      VALUES (${id}, ${name}, ${avatar ?? null}, ${createdAt})
      ON CONFLICT (id) DO NOTHING
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[api/players POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
