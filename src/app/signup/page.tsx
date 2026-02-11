function SignupForm({ error }: { error?: string }) {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Criar conta (tenant + usuário)</h1>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}
      <form className="space-y-4" method="post" action="/api/auth/signup">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nome da empresa (Tenant)</label>
          <input name="tenantName" required className="w-full rounded-lg border p-2" placeholder="Ex.: Arycar" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug do tenant (URL)</label>
          <input
            name="tenantSlug"
            required
            pattern="[a-z0-9-]{2,32}"
            className="w-full rounded-lg border p-2"
            placeholder="ex.: arycar"
          />
          <p className="text-xs text-slate-600">Aparece na URL: /&lt;slug&gt;/app. Apenas letras minúsculas, números e hífen.</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Seu nome</label>
          <input name="name" required className="w-full rounded-lg border p-2" placeholder="Seu nome" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border p-2" placeholder="voce@empresa.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Senha</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border p-2"
            placeholder="mínimo 8 caracteres"
          />
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Criar e entrar</button>
      </form>
      <p className="text-sm text-slate-700">
        Já tem conta? Use o login em <a href="/demo/login">/demo/login</a> (troque &quot;demo&quot; pelo seu tenant).
      </p>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams?: { error?: string } }) {
  return <SignupForm error={searchParams?.error} />;
}
