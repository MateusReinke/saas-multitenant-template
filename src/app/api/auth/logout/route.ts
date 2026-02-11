import { NextResponse } from 'next/server';
import { deleteSessionByCookie, enforceSameOrigin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    enforceSameOrigin();
    await deleteSessionByCookie();
  } catch {
    // ignore
  }
  return NextResponse.redirect(new URL('/', req.url));
}
