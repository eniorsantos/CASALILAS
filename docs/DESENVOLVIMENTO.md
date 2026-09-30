# Desenvolvimento local

## Pré-requisitos

- Node 20+ · npm · Docker (Postgres dos testes + serviços locais)

## Setup (primeira vez)

```powershell
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
npm install
npx prisma migrate dev        # aplica migrations no Postgres local
npm run dev                   # http://localhost:3000
npm run dev:workers           # terminal separado — workers BullMQ
```

## Variáveis de ambiente

`.env.example` já traz placeholders dummy válidos — `cp` funciona sem quebrar `prisma generate`. Para fluxo real (pagamento, vídeo, email), preencha:

| Variável | Onde obter | Obrigatória p/ |
|---|---|---|
| `DATABASE_URL` | `infra/docker-compose.yml` (local) ou Railway (staging/prod) | tudo |
| `REDIS_URL` | idem | filas/workers |
| `APP_URL` | `http://localhost:3000` local; URL pública em staging/prod (webhooks e links de email) | checkout, emails |
| `AUTH_SECRET` | `npx auth secret` | Auth.js |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console | login social |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe (**teste** em dev/staging) | checkout cartão |
| `MP_ACCESS_TOKEN` | Painel Mercado Pago (**teste** em dev/staging) | Pix/boleto |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` / `MUX_SIGNING_KEY_*` | Dashboard Mux | upload/playback |
| `RESEND_API_KEY` | Resend | emails (workers) |
| `STORAGE_*` | R2/S3 | PDFs de certificado |

Nunca commitar `.env` (está no `.gitignore`). Produção usa chaves **reais** via Vercel/Railway env vars; staging usa chaves de **teste**.

## Banco de dados

```powershell
npx prisma migrate dev --name descricao   # nova migration em dev
npx prisma migrate deploy                 # aplica (CI, staging, prod)
npm run db:studio                         # Prisma Studio — inspecionar dados
```

`prisma/migrations/000_init/` é o baseline (schema inicial); migrations seguintes são ajustes incrementais aplicados em ordem. Em produção, toda migration roda **após backup** (ver [TESTES-E-CICD.md](TESTES-E-CICD.md)) e remoções de coluna seguem o padrão aditivo em 2 deploys.

## Scripts (`package.json`)

`dev`, `dev:web`, `dev:workers`, `start`, `start:workers`, `build` (= `prisma generate && next build`), `lint` (ESLint 9 flat), `type-check`, `test`/`test:watch`/`test:coverage`, `db:migrate`/`db:deploy`/`db:studio`.

## Convenções de código

1. **Mutação = Server Action**, não rota API separada. Toda action de admin começa com `requireRole()` e, para curso específico, `assertOwnsCourse()` (`app/(admin)/admin/cursos/actions.ts`).
2. **Leitura de acesso = `hasAccessToCourse()`** (`lib/access.ts`). Nunca replicar a lógica enrollment-vs-assinatura em outro lugar.
3. **Preço vem do banco no backend.** Nunca confiar em valor enviado pelo frontend.
4. **Páginas que leem o banco são `force-dynamic`** (build sem DB). Rotas API já são dinâmicas por padrão.
5. **SDKs externos com fallback dummy no import** e construção dentro do handler quando possível — o build não pode exigir credenciais reais.
6. **Trabalho lento vai para fila** (email, PDF, reação a webhook). Regra: se depende de serviço externo ou demora > ~200ms, enfileira.
7. **Transação para escrita dupla** — `payment + enrollment` sempre em `prisma.$transaction`; reordenação de módulos idem.
8. **Bull Board (`workers/dashboard.ts`) nunca público** — proteger com auth antes de expor.
