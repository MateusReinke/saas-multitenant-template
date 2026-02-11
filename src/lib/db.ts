import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Missing DATABASE_URL");
}

// Cliente real do postgres
const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Workaround TS 5.7+:
 * o postgres retorna um "thenable" e o TypeScript reclama ao usar await.
 * Aqui tipamos o template tag como retornando Promise<T[]>.
 */
export const db = sql as unknown as (<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<T[]>) &
  typeof sql;

export type SQL = typeof sql;

export async function withRls<T>(
  tenantId: string,
  userId: string,
  fn: (sql: SQL) => Promise<T>
) {
  return sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`select set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}
