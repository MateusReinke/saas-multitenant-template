export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Template SaaS Multi-tenant</h1>
      <p className="text-slate-700">
        Este projeto é um starter para SaaS com <strong>multi-tenant</strong> (tenant por slug na rota),
        <strong> Postgres</strong> e <strong>Row Level Security (RLS)</strong>.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">1) Criar um tenant + usuário</h2>
          <p className="text-sm text-slate-700">Cria um tenant (org) e o usuário owner, já logado.</p>
          <a className="inline-block mt-3" href="/signup">Ir para signup →</a>
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">2) Login por tenant</h2>
          <p className="text-sm text-slate-700">Exemplo de rota: /&lt;tenant&gt;/login</p>
          <a className="inline-block mt-3" href="/demo/login">Ir para login demo →</a>
        </div>
      </div>
      <div className="rounded-xl border p-4 text-sm">
        <div className="font-semibold">Por que RLS?</div>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          <li>Defesa em profundidade: mesmo que um bug no código aconteça, o banco bloqueia vazamento entre tenants.</li>
          <li>Auditoria e controle central de acesso.</li>
        </ul>
      </div>
    </div>
  );
}
