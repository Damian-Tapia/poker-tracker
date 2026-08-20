// node --env-file=.env.local scripts/run-schema.mjs
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL no está definida en .env.local');
  process.exit(1);
}

const ssl = process.env.DATABASE_SSL === 'false' ? false : 'prefer';
const sql = postgres(url, { max: 1, connect_timeout: 10, ssl });

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.sql');
const schema = readFileSync(schemaPath, 'utf8');

try {
  console.log('Aplicando schema...');
  await sql.unsafe(schema);
  console.log('✓ Schema aplicado');

  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Tablas:', tables.map((r) => r.tablename).join(', '));
} catch (e) {
  console.error('✗ Error:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
