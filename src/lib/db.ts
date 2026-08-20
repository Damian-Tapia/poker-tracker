import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var _sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis._sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.DATABASE_SSL === 'false' ? false : 'prefer',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._sql = sql;
}
