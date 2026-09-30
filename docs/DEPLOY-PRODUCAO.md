# Deploy em produção real (runbook)

Guia passo a passo para tirar o projeto do `localhost` e colocar no ar de verdade: web na **Vercel**, Postgres + Redis + workers na **Railway**, gateways em modo **live**. Ordem importa — siga na sequência.

## 0. O que você precisa antes

| Conta / serviço | Para quê |
|---|---|
| Vercel | hospedar o Next.js |
| Railway | Postgres 16, Redis e o service de workers |
| Stripe (conta ativada p/ produção) | cartões + assinaturas reais |
| Mercado Pago (credenciais produção) | Pix/boleto/cartão BR |
| Mux | vídeo (upload + playback assinado) |
| Resend + domínio próprio verificado | emails que não caem no spam |
| Google Cloud Console (OAuth) | login social |
| Domínio próprio | `APP_URL` final (ex.: `https://cursos.seusite.com`) |
| Slack (opcional) | notificação de deploy |

> Regra de ouro: **staging usa chaves de teste, produção usa chaves live**. Nunca misture.

## 1. Railway — banco, Redis e workers

1. Crie um projeto na Railway com 3 services: **Postgres** (imagem 16), **Redis** e **workers** (conectado ao repo GitHub, branch `main`).
2. No Postgres, **ative backups automáticos diários** (aba Backups) e anote a `DATABASE_URL` pública.
3. No Redis, confirme que há **volume/persistência** (jobs do BullMQ não podem evaporar num restart).
4. No service `workers`, configure:
   - **Start command:** `npm run start:workers` (ponto de entrada `workers/index.ts`)
   - **Sem porta HTTP** — worker não serve tráfego; se a Railway exigir healthcheck, desative para este service.
   - Env vars (environment `production`): `DATABASE_URL` (use a URL **interna** da Railway), `REDIS_URL` (interna), `RESEND_API_KEY`, `APP_URL`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `STORAGE_BUCKET`, `STORAGE_PUBLIC_URL`.

## 2. Primeira migration em produção (com backup)

O pipeline faz isso sozinho nos próximos deploys, mas a **primeira vez é manual** (o banco ainda está vazio e o `APP_URL`/DNS ainda não existem):

```powershell
$env:DATABASE_URL="postgresql://...railway.../railway"  # URL pública do Postgres prod
npx prisma migrate deploy
```

Em deploys seguintes, o workflow `deploy-production.yml` faz antes um `pg_dump` (`backup-pre-deploy.sql`) e só então o `migrate deploy`. Nunca edite migration já aplicada — corrija com migration nova.

## 3. Seed mínimo: admin + planos

Sem isso não há quem publique curso nem plano para vender. Crie um script de uso único `scripts/create-admin.ts`:

```ts
// Uso: DATABASE_URL="<prod>" npx tsx scripts/create-admin.ts "Seu Nome" "voce@seusite.com" "senha-forte-aqui"
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) throw new Error("Informe nome, email e senha");

const user = await prisma.user.upsert({
  where: { email },
  update: { role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  create: { name, email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
});
console.log("Admin pronto:", user.id, user.email);
await prisma.$disconnect();
```

```powershell
$env:DATABASE_URL="postgresql://...prod..."
npx tsx scripts/create-admin.ts "Seu Nome" "voce@seusite.com" "senha-forte-aqui"
Remove-Item scripts/create-admin.ts   # uso único: apague depois
```

Planos (`Plan`): crie primeiro o **Product + Price recorrente** no dashboard da Stripe (modo live), copie o `price_id` (`price_…`) e cadastre o plano via `npx prisma studio` (com `DATABASE_URL` de prod) preenchendo `name`, `priceCents`, `interval`, `stripePriceId`, `isAllCourses`. Para o MP, o Preapproval é criado por checkout — basta ter o plano cadastrado.

## 4. Vercel — o frontend

1. Importe o repositório na Vercel (branch de produção: `main`). O build padrão já funciona: `npm run build` (= `prisma generate && next build`, 22/22 páginas validadas).
2. Em **Settings → Environment Variables** (environment **Production**), cadastre:

| Variável | Valor em produção |
|---|---|
| `DATABASE_URL` | Postgres prod (URL pública da Railway) |
| `REDIS_URL` | Redis prod (pública) |
| `APP_URL` | `https://cursos.seusite.com` (seu domínio final) |
| `AUTH_SECRET` | gerado com `npx auth secret` (um por ambiente) |
| `AUTH_URL` | `https://cursos.seusite.com` (obrigatório p/ Auth.js v5 fora do localhost) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth de produção (com redirect abaixo) |
| `STRIPE_SECRET_KEY` | `sk_live_…` (**live**) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` do endpoint de produção |
| `MP_ACCESS_TOKEN` | token de **produção** do MP |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` / `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY_PRIVATE` | Mux produção |
| `RESEND_API_KEY` | Resend produção |
| `STORAGE_BUCKET` / `STORAGE_PUBLIC_URL` | R2/S3 produção |

3. Deploy. Depois conecte o **domínio** (Settings → Domains) e confira que `APP_URL` == URL canônica (checkout, emails e `notification_url` do MP dependem dela).

## 5. Provedores externos em modo live

- **Stripe:** ative a conta p/ produção → troque para keys `sk_live` → crie o endpoint `https://SEU-DOMINIO/api/webhooks/stripe` ouvindo **exatamente**: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` → cole o `whsec_…` na Vercel. Teste com pagamento real de valor mínimo e **reembolse** em seguida.
- **Mercado Pago:** credenciais de produção; a `notification_url` (`/api/webhooks/mercadopago`) é enviada a cada preferência, então basta o `APP_URL` estar correto e público em HTTPS. Valide com um Pix real de valor mínimo.
- **Google OAuth:** em APIs e serviços → Credenciais → adicione a origem `https://SEU-DOMINIO` e o redirect **exato** `https://SEU-DOMINIO/api/auth/callback/google`.
- **Mux:** crie as **signing keys** de produção e (recomendado) configure o webhook `https://SEU-DOMINIO/api/webhooks/mux` no dashboard para `video.asset.ready`/`errored`.
- **Resend:** verifique o domínio (SPF/DKIM) e use `cursos@seusite.com` como remetente.

## 6. GitHub — pipeline de produção

1. Em **Settings → Secrets → Actions**, cadastre exatamente: `RAILWAY_TOKEN_PRODUCTION`, `PRODUCTION_DATABASE_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SLACK_WEBHOOK_URL` (mais os de staging/teste já previstos nos workflows).
2. Em **Settings → Environments → `production`**, exija **Required reviewers** (aprovação manual antes de migrar/deployar).
3. Em **Settings → Branches**, proteja `main`: exigir PR + workflow `PR Checks` verde. A partir daqui, todo push em `main` roda: testes → aprovação → backup → migrate → deploy Vercel + workers → Slack.

## 7. Go-live — smoke test na ordem do dinheiro

Execute em produção, na sequência (pare no primeiro vermelho):

1. `/cadastro` + login + login com Google.
2. Como admin, crie e publique um curso de teste (módulo + aula).
3. Compre o curso no **Stripe** (cartão real, valor mínimo) → confira `Payment=PAID` + `Enrollment=ACTIVE` (Studio) e o email de boas-vindas.
4. Repita no **MP via Pix** (valor mínimo).
5. Assista à aula: player carrega (URL assinada), progresso salva, 90% conclui.
6. Conclua o curso → certificado emitido + página `/certificados/verificar/[hash]` válida.
7. Assinatura Stripe: assine um plano → cancele → confira `CANCELED` com acesso até o fim do período (e `PAST_DUE` simulável com cartão de teste `4000000000000341` **em staging**).
8. Reembolse/arquive os cursos e pagamentos de teste.

## 8. Pós go-live (rotina)

- **Deploys:** `feature/*` → PR (`PR Checks` + preview) → `develop` (staging, chaves teste) → `main` (produção, aprovação + backup). Nunca `migrate` direto à mão em prod fora de emergência.
- **Logs:** Vercel (web) + Railway (workers/Postgres) diariamente na 1ª semana; Bull Board em `:3001` **com auth**; tela de `FailedJob` no admin para reprocesso.
- **Monitoramento recomendado:** Sentry no Next + workers (falhas de job), alerta de `PAST_DUE` e de webhook 400 (possível fraude ou secret trocado).
- **Rollback:** código → promover deploy anterior na Vercel; banco → restaurar backup **somente** se a migration quebrou (regra: corrigir para frente com migration nova; restore é último recurso e perde dados desde o backup).

## 9. Troubleshooting de produção

| Sintoma | Causa provável |
|---|---|
| Login/Google em loop ou `CallbackRouteError` | `AUTH_URL` ≠ domínio canônico; redirect do Google sem `/api/auth/callback/google` exato |
| Webhook Stripe 400 | `STRIPE_WEBHOOK_SECRET` de outro endpoint (teste vs live) |
| Pagamento aprovado, matrícula não criada | worker/web sem `DATABASE_URL` de prod; ver logs da rota + `FailedJob` |
| Aula não carrega (`playback-url` 403/404) | sem acesso (ok) ou `videoAssetId` ainda é `upload_id` (webhook Mux não configurado) |
| Deploy trava no `migrate` | lock de migration anterior (`prisma migrate resolve`) ou `PRODUCTION_DATABASE_URL` errada |
| Workers em crash loop | `REDIS_URL` interna errada/inacessível; checar Railway service logs |
