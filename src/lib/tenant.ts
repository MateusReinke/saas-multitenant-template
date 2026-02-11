import { db } from "./db";

export type Tenant = { id: string; slug: string; name: string };

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const rows = await db<Tenant>`
    select id, slug, name
    from tenants
    where slug = ${slug}
    limit 1
  `;
  return rows[0] ?? null;
}
