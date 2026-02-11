# SaaS Multi-tenant Template (Docker + Postgres + RLS)

Base pronta para você usar como **template** de SaaS:

- **Multi-tenant** por *slug* (URL: `/<tenant>/...`)
- **Login + sessão** com cookie httpOnly
- **PostgreSQL** com **Row Level Security (RLS)** (defesa em profundidade)
- **Docker Compose** para subir app + banco

## Subir local (Docker)

```bash
docker compose up -d --build
```

Abra: `http://localhost:3000`

- Criar conta: `http://localhost:3000/signup`
- Login: `http://localhost:3000/<tenant>/login`
- App: `http://localhost:3000/<tenant>/app`

> **Senhas do exemplo** estão em `docker-compose.yml` e `db/init/01_app_user.sql`. Troque por valores fortes.

## Como o multi-tenant é garantido

1. O *tenant* é definido pelo **slug na rota**.
2. O servidor valida que o usuário logado pertence ao tenant.
3. O Postgres aplica **RLS** nas tabelas tenant-scoped (`notes`, `memberships`) usando variáveis de sessão:

```sql
SET LOCAL app.tenant_id = '<tenant_uuid>';
SET LOCAL app.user_id = '<user_uuid>';
```

As políticas estão em `db/migrations/002_rls.sql`.

## Estrutura do banco

- `tenants`: organizações
- `users`: usuários
- `memberships`: vínculo usuário↔tenant + role (owner/admin/member)
- `sessions`: sessões (token hash)
- `notes`: exemplo de dado tenant-scoped

## Seed opcional

Se quiser criar um tenant demo:

```bash
docker compose run --rm migrate npm run db:seed
```

## Produção (recomendações)

- Coloque o app atrás de HTTPS (proxy) e habilite HSTS.
- Use secrets (Coolify/Docker secrets/Vault) em vez de senhas no compose.
- Ative observabilidade (logs estruturados, métricas, auditoria).
- Rate limit, bloqueio de brute force, e-mail de reset, 2FA, etc.

## Multi-tenancy: 3 estratégias (resumo)

- **Row-based** (este template): um banco, mesmas tabelas, coluna `tenant_id` + RLS.
- **Schema por tenant**: mais isolamento, mais complexidade de migração.
- **Database por tenant**: máximo isolamento, custo/operacional maior.
