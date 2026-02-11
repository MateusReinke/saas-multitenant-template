import { NextResponse } from "next/server";
import { db, withRls } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { enforceSameOrigin, createSessionRecord, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { getTenantBySlug } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    enforceSameOrigin();

    const formData = await req.formData();
    const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/demo/login?error=Dados%20inválidos`, req.url));
    }

    const { tenantSlug, email, password } = parsed.data;

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.redirect(new URL(`/${tenantSlug}/login?error=Tenant%20não%20encontrado`, req.url));
    }

    const userRows = await db<{ id: string; password_hash: string }>`
      select id, password_hash
      from users
      where email = ${email}
      limit 1
    `;
    const user = userRows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.redirect(new URL(`/${tenantSlug}/login?error=Credenciais%20inválidas`, req.url));
    }

    // RLS check: user must belong to this tenant
    const membership = await withRls(tenant.id, user.id, async (sql) => {
      const rows = await sql<{ role: string }>`
        select role
        from memberships
        where tenant_id = ${tenant.id} and user_id = ${user.id}
        limit 1
      `;
      return rows[0] ?? null;
    });

    if (!membership) {
      return NextResponse.redirect(new URL(`/${tenantSlug}/login?error=Sem%20acesso%20a%20este%20tenant`, req.url));
    }

    const { token, expires } = await createSessionRecord(user.id);
    setSessionCookie(token, expires);

    return NextResponse.redirect(new URL(`/${tenantSlug}/app`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/demo/login?error=Erro%20ao%20logar`, req.url));
  }
}
