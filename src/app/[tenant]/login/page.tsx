export default function Page({
  params,
  searchParams
}: {
  params: { tenant: string };
  searchParams?: { error?: string };
}) {
  const tenant = params.tenant;
  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold">
        Login — <span className="font-mono">{tenant}</span>
      </h1>
      {searchParams?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {searchParams.error}
        </div>
      ) : null}

      <form className="space-y-4" method="post" action="/api/auth/login">
        <input type="hidden" name="tenantSlug" value={tenant} />
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border p-2" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Senha</label>
          <input name="password" type="password" required className="w-full rounded-lg border p-2" />
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Entrar</button>
      </form>

      <p className="text-sm text-slate-700">
        Não tem conta? <a href="/signup">Crie um tenant</a>.
      </p>
    </div>
  );
}
