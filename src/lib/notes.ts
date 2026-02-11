import { withRls } from './db';

export type Note = {
  id: number;
  title: string;
  body: string;
  owner_user_id: string;
  created_at: string;
};

export async function listNotes(tenantId: string, userId: string): Promise<Note[]> {
  return withRls(tenantId, userId, async (sql) => {
    return sql<Note>`
      select id, title, body, owner_user_id, created_at
      from notes
      order by id desc
      limit 50
    `;
  });
}

export async function createNote(
  tenantId: string,
  userId: string,
  title: string,
  body: string
) {
  return withRls(tenantId, userId, async (sql) => {
    const rows = await sql<{ id: number }>`
      insert into notes (tenant_id, owner_user_id, title, body)
      values (${tenantId}, ${userId}, ${title}, ${body})
      returning id
    `;
    return rows[0];
  });
}
