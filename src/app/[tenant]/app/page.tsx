import { requireTenantSession } from '@/lib/auth';
import { listNotes } from '@/lib/notes';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { tenant: string } }) {
  const tenantSlug = params.tenant;
  const { user, tenant } = await requireTenantSession(tenantSlug);
  const notes = await listNotes(tenant.id, user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-700">
            Tenant: <span className="font-mono">{tenant.slug}</span> — Usuário: {user.email}
          </p>
        </div>
        <form method="post" action="/api/auth/logout">
          <button className="rounded-lg border px-3 py-2 text-sm">Sair</button>
        </form>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Criar nota (exemplo de dado tenant-scoped)</h2>
        <form className="mt-3 space-y-3" method="post" action="/api/notes">
          <input type="hidden" name="tenantSlug" value={tenant.slug} />
          <div className="space-y-1">
            <label className="text-sm font-medium">Título</label>
            <input name="title" required className="w-full rounded-lg border p-2" placeholder="Ex.: Primeira nota" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Conteúdo</label>
            <textarea name="body" className="w-full rounded-lg border p-2" rows={4} placeholder="Opcional" />
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Salvar</button>
        </form>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Últimas notas</h2>
        {notes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">Nenhuma nota ainda.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-slate-500">#{n.id}</div>
                </div>
                {n.body ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{n.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border p-4 text-sm text-slate-700">
        <div className="font-semibold">Como o multi-tenant está sendo garantido?</div>
        <ul className="mt-2 list-disc pl-5">
          <li>O tenant vem do slug na rota (/{tenant.slug}/...).</li>
          <li>O servidor valida que o usuário é membro do tenant.</li>
          <li>O Postgres aplica RLS usando app.tenant_id e app.user_id (defesa em profundidade).</li>
        </ul>
      </div>
    </div>
  );
}
