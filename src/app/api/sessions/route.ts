import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { rowToSession } from '@/lib/db-mappers';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM sessions ORDER BY date DESC`;
    return NextResponse.json(rows.map(rowToSession));
  } catch (e) {
    console.error('[api/sessions GET]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, date, location, status, mode, currency, rake, chipRack, createdAt } = await req.json();
    await sql`
      INSERT INTO sessions (id, date, location, status, mode, currency, rake, chip_rack, created_at)
      VALUES (
        ${id}, ${date}, ${location ?? null}, ${status}, ${mode ?? null},
        ${currency ?? 'MXN'}, ${rake ?? 0},
        ${chipRack ? JSON.stringify(chipRack) : null},
        ${createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[api/sessions POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
