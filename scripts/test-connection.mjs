// node --env-file=.env.local scripts/test-connection.mjs
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL no está definida en .env.local');
  process.exit(1);
}

console.log('Conectando a:', url.replace(/:\/\/[^@]+@/, '://***@'));

const ssl = process.env.DATABASE_SSL === 'false' ? false : 'prefer';
const sql = postgres(url, { max: 1, connect_timeout: 10, ssl });

try {
  const [row] = await sql`SELECT version()`;
  console.log('✓ Conectado:', row.version.slice(0, 60));
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Tablas:', tables.map((r) => r.tablename).join(', ') || '(ninguna — correr schema.sql)');
} catch (e) {
  console.error('✗ Error:', e.message);
  if (e.message.includes('CONNECT_TIMEOUT') || e.message.includes('ECONNREFUSED')) {
    console.error('\nPosible causa: el servidor no acepta conexiones remotas en puerto 5432.');
    console.error('El amigo necesita:');
    console.error('  1. postgresql.conf → listen_addresses = \'*\'');
    console.error('  2. pg_hba.conf → host all all 0.0.0.0/0 scram-sha-256');
    console.error('  3. Firewall → sudo ufw allow 5432/tcp');
  } else if (e.message.includes('SSL') || e.message.includes('ssl')) {
    console.error('\nPosible causa: SSL. Probar con DATABASE_SSL=false en .env.local');
  }
  process.exit(1);
} finally {
  await sql.end();
}
