import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signupSchema } from '@/lib/validators';
import { enforceSameOrigin, createSessionRecord, setSessionCookie } from '@/lib/auth';
import { hashPassword } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    enforceSameOrigin();

    const formData = await req.formData();
    const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/signup?error=Dados%20inválidos`, req.url));
    }

    const { tenantName, tenantSlug, name, email, password } = parsed.data;
    const passwordHash = hashPassword(password);

    const result = await db.begin(async (sql) => {
      const tenantRows = await sql<{ id: string; slug: string }[]>`
        insert into tenants (slug, name)
        values (${tenantSlug}, ${tenantName})
        returning id, slug
      `;
      const tenant = tenantRows[0];

      const userRows = await sql<{ id: string }[]>`
        insert into users (email, name, password_hash)
        values (${email}, ${name}, ${passwordHash})
        returning id
      `;
      const user = userRows[0];

      // Configure RLS context for bootstrapping the first membership row.
      await sql`select set_config('app.tenant_id', ${tenant.id}, true)`;
      await sql`select set_config('app.user_id', ${user.id}, true)`;

      await sql`
        insert into memberships (tenant_id, user_id, role)
        values (${tenant.id}, ${user.id}, 'owner')
      `;

      return { tenant, user };
    });

    const { token, expires } = await createSessionRecord(result.user.id);
    setSessionCookie(token, expires);

    return NextResponse.redirect(new URL(`/${result.tenant.slug}/app`, req.url));
  } catch (err: any) {
    const msg = (err?.message ?? '').toLowerCase();
    const isUnique = msg.includes('unique') || msg.includes('duplicate');
    const error = isUnique ? 'Tenant%20ou%20email%20já%20existem' : 'Erro%20ao%20criar%20conta';
    return NextResponse.redirect(new URL(`/signup?error=${error}`, req.url));
  }
}
