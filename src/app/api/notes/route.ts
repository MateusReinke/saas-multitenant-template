import { NextResponse } from 'next/server';
import { createNoteSchema } from '@/lib/validators';
import { enforceSameOrigin, getTenantSession } from '@/lib/auth';
import { createNote } from '@/lib/notes';

export async function POST(req: Request) {
  try {
    enforceSameOrigin();

    const formData = await req.formData();
    const parsed = createNoteSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.redirect(new URL(`/`, req.url));
    }

    const { tenantSlug, title, body } = parsed.data;
    const session = await getTenantSession(tenantSlug);
    if (!session) {
      return NextResponse.redirect(new URL(`/${tenantSlug}/login`, req.url));
    }

    await createNote(session.tenant.id, session.user.id, title, body ?? '');

    return NextResponse.redirect(new URL(`/${tenantSlug}/app`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/`, req.url));
  }
}
