import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SaaS Multi-tenant Template',
  description: 'A secure multi-tenant starter with Postgres RLS + sessions.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen">
          <header className="border-b">
            <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
              <div className="font-semibold">SaaS Template</div>
              <nav className="flex gap-4 text-sm">
                <a href="/signup">Criar conta</a>
                <a href="/demo/login">Login (demo)</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl p-4">{children}</main>
          <footer className="mx-auto max-w-5xl p-4 text-xs text-slate-500">
            Base multi-tenant com Postgres + RLS.
          </footer>
        </div>
      </body>
    </html>
  );
}
