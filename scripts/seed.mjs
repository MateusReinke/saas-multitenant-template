import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';

const adminUrl = process.env.DATABASE_URL_ADMIN;
if (!adminUrl) {
  console.error('Missing DATABASE_URL_ADMIN');
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

const sql = postgres(adminUrl, { max: 1 });

async function main() {
  const demoTenantSlug = 'demo';
  const demoEmail = 'demo@demo.com';
  const demoPassword = 'demo12345';

  const existingTenant = await sql`SELECT id FROM tenants WHERE slug = ${demoTenantSlug}`;
  if (existingTenant.length) {
    console.log('Demo tenant already exists. Skipping.');
    await sql.end({ timeout: 5 });
    return;
  }

  await sql.begin(async (tx) => {
    const [tenant] = await tx`
      INSERT INTO tenants (slug, name)
      VALUES (${demoTenantSlug}, ${'Demo Inc'})
      RETURNING id
    `;

    const [user] = await tx`
      INSERT INTO users (email, name, password_hash)
      VALUES (${demoEmail}, ${'Demo User'}, ${hashPassword(demoPassword)})
      RETURNING id
    `;

    await tx`
      INSERT INTO memberships (tenant_id, user_id, role)
      VALUES (${tenant.id}, ${user.id}, ${'owner'})
    `;
  });

  console.log('Seeded demo tenant.');
  console.log(`Tenant: /${demoTenantSlug}`);
  console.log(`Email:  ${demoEmail}`);
  console.log(`Senha:  ${demoPassword}`);

  await sql.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error(err);
  try {
    await sql.end({ timeout: 5 });
  } catch {}
  process.exit(1);
});
