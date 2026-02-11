import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function base64url(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function randomToken(bytes = 32) {
  return base64url(randomBytes(bytes));
}

export function sha256Base64url(value: string) {
  const hash = createHash('sha256').update(value).digest();
  return base64url(hash);
}

// scrypt params chosen for a good default on general servers.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 6) return false;
  const [algo, nStr, rStr, pStr, saltB64, keyB64] = parts;
  if (algo !== 'scrypt') return false;

  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  const actual = scryptSync(password, salt, expected.length, { N, r, p });
  return timingSafeEqual(actual, expected);
}
