import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('Missing DATABASE_URL');
}

export const db = postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export type SQL = typeof db;

export async function withRls<T>(
  tenantId: string,
  userId: string,
  fn: (sql: SQL) => Promise<T>
) {
  return db.begin(async (sql) => {
    await sql`select set_config('app.tenant_id', ${tenantId}, true)`;
    await sql`select set_config('app.user_id', ${userId}, true)`;
    return fn(sql);
  });
}
