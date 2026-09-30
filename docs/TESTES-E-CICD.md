# Testes e CI/CD

## Testes (`vitest.config.ts` + `tests/setup.ts`)

- **Banco real via Testcontainers** (Postgres 16 em Docker), schema aplicado com `prisma migrate deploy`, tabelas truncadas (`CASCADE`) a cada teste. Nada de SQLite/mocks para lógica de banco: `enum`, `@@unique` composto e transações se comportam diferente em fake.
- Requer Docker rodando. Sem Docker, `npm run test` falha no `beforeAll` — esperado.

## Suítes existentes

| Arquivo | Cobre |
|---|---|
| `tests/actions/course.test.ts` | `createCourse`: sucesso (slug + `DRAFT`), título curto, preço negativo |
| `tests/actions/course-ownership.test.ts` | instrutor não edita curso de outro (`assertOwnsCourse`) |
| `tests/actions/password-reset.test.ts` | token válido / expirado / reutilizado |
| `tests/webhooks/stripe.test.ts` | pagamento+matrícula, **idempotência** (evento 2× = 1 payment), assinatura inválida → 400 |
| `tests/webhooks/mercadopago.test.ts` | Pix `pending` **não** cria matrícula |

Comandos: `npm run test` (única), `test:watch`, `test:coverage`.

## Prioridades (o que testar primeiro)

| Prioridade | Alvo | Motivo |
|---|---|---|
| Crítica | Webhooks (sucesso, idempotência, assinatura inválida) | erro = perda financeira |
| Crítica | Autorização (`assertOwnsCourse`, `requireRole`) | erro = vazamento entre usuários |
| Alta | Reset de senha (expiração, uso único) | erro = brecha de conta |
| Média | Schemas Zod | erro aparece rápido em uso |
| Baixa | Componentes visuais | baixo risco, teste caro |

Todo teste novo de webhook cobre os 3 casos: sucesso, repetição, assinatura inválida.

## Ambientes

```
main (prod)     → Vercel (prod) + Railway (prod: Postgres, Redis, workers)
develop (stage) → Vercel (preview fixo) + Railway (stage)
feature/* (PR)  → Vercel (preview automático) + banco de staging
```

Frontend na Vercel; Postgres/Redis/workers na Railway (processos persistentes).

## Workflows (`.github/workflows/`)

- **`pr.yml`** — em PR p/ `main`/`develop`: Postgres service → `npm ci` → lint → type-check → `migrate deploy` (banco de teste) → `test` (chaves de **teste**) → `build`. Proteger `main` exigindo este check verde.
- **`deploy-staging.yml`** — push em `develop`: testes → `migrate deploy` (staging) → deploy Vercel (staging) + Railway workers (staging).
- **`deploy-production.yml`** — push em `main`: testes → job com `environment: production` (**aprovação manual** em Settings → Environments) → backup (`pg_dump`) → `migrate deploy` (prod) → deploys → notificação Slack.

## Secrets e env vars

| Onde | O quê |
|---|---|
| GitHub Secrets | `VERCEL_TOKEN`, `RAILWAY_TOKEN_*`, `*_DATABASE_URL`, chaves de teste Stripe/MP, `SLACK_WEBHOOK_URL` |
| Vercel env vars | runtime do frontend, por ambiente (Production/Preview/Development) |
| Railway env vars | `DATABASE_URL`, `REDIS_URL`, chaves reais Stripe/MP/Mux p/ workers |

Nunca commitar `.env`; `.env.example` é a referência.

## Rollback

- **Banco:** migrations aditivas em 2 etapas (deploy 1 para de usar a coluna; deploy 2 remove dias depois) + backup automático pré-migration.
- **Código:** promover o deploy anterior na Vercel (`vercel rollback` ou dashboard) — sem tocar no banco.

## Checklist

- [ ] Testes contra Postgres real, nunca mocks p/ banco
- [ ] Webhook: sucesso + idempotência + assinatura inválida
- [ ] `main` protegida (workflow verde obrigatório)
- [ ] Produção com aprovação manual + backup pré-migration
- [ ] Nenhum secret commitado; staging com chaves de teste
