import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const adminUrl = process.env.DATABASE_URL_ADMIN;
if (!adminUrl) {
  console.error('Missing DATABASE_URL_ADMIN');
  process.exit(1);
}

const sql = postgres(adminUrl, { max: 1 });
const migrationsDir = path.join(process.cwd(), 'db', 'migrations');

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const rows = await sql`SELECT id FROM schema_migrations`;
  const applied = new Set(rows.map((r) => r.id));

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations folder found. Skipping.');
    await sql.end({ timeout: 5 });
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const contents = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);

    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`INSERT INTO schema_migrations (id) VALUES (${file})`;
    });
  }

  await sql.end({ timeout: 5 });
  console.log('Migrations complete.');
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sql.end({ timeout: 5 });
  } catch {}
  process.exit(1);
});
