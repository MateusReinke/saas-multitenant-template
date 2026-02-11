import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withRls } from './db';
import { randomToken, sha256Base64url } from './crypto';
import type { Tenant } from './tenant';
import { getTenantBySlug } from './tenant';

export type User = { id: string; email: string; name: string };

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'st_session';
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? '30');

function getOriginSafe() {
  try {
    return headers().get('origin') ?? '';
  } catch {
    return '';
  }
}

export function enforceSameOrigin() {
  const base = process.env.APP_BASE_URL ?? '';
  const origin = getOriginSafe();
  if (base && origin && origin !== base) {
    throw new Error('Invalid origin');
  }
}

export async function createSessionRecord(userId: string) {
  const token = randomToken(32);
  const tokenHash = sha256Base64url(token);
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  await db`
    insert into sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, ${expires.toISOString()})
  `;

  return { token, expires };
}

export function setSessionCookie(token: string, expires: Date) {
  const isProd = process.env.NODE_ENV === 'production';
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    expires
  });
}

export async function getSessionUser(): Promise<User | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = sha256Base64url(token);

  const rows = await db<User[]>`
    select u.id, u.email, u.name
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
    limit 1
  `;

  return rows[0] ?? null;
}

export async function deleteSessionByCookie() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return;
  const tokenHash = sha256Base64url(token);
  await db`delete from sessions where token_hash = ${tokenHash}`;
  cookies().set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
}

export type TenantSession = { user: User; tenant: Tenant };

export async function getTenantSession(tenantSlug: string): Promise<TenantSession | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return null;

  const ok = await withRls(tenant.id, user.id, async (sql) => {
    const rows = await sql`select 1 from memberships where tenant_id = ${tenant.id} and user_id = ${user.id} limit 1`;
    return rows.length > 0;
  });

  if (!ok) return null;
  return { user, tenant };
}

export async function requireTenantSession(tenantSlug: string): Promise<TenantSession> {
  const session = await getTenantSession(tenantSlug);
  if (!session) {
    redirect(`/${tenantSlug}/login`);
  }
  return session;
}
