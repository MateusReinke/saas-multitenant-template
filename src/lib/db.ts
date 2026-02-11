import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

/**
 * Cliente base do postgres.js (ele é "thenable", e o TS 5.7+ reclama em alguns awaits).
 */
const sqlBase = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * A "tag" tipada como Promise<T[]> para o TypeScript aceitar await normalmente.
 * (O postgres.js retorna um array de linhas.)
 */
export type SqlTag = <T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<T[]>;

/**
 * Export principal para queries fora de transação.
 */
export const db = sqlBase as unknown as SqlTag & typeof sqlBase;

/**
 * Export para usar métodos adicionais do postgres.js quando necessário (begin, end, etc.).
 */
export const sql = sqlBase;

/**
 * Executa uma função dentro de uma transação com RLS context setado.
 * IMPORTANTE: dentro do callback, o "tx" também é tipado como SqlTag.
 */
export async function withRls<T>(
  tenantId: string,
  userId: string,
  fn: (sql: SqlTag) => Promise<T>
): Promise<T> {
  return sqlBase.begin(async (tx) => {
    const txTag = tx as unknown as SqlTag;

    await txTag`select set_config('app.tenant_id', ${tenantId}, true)`;
    await txTag`select set_config('app.user_id', ${userId}, true)`;

    return fn(txTag);
  });
}
