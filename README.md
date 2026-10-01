# Plataforma de Cursos Online

Plataforma de cursos full-stack em Next.js 14 (App Router + Server Actions): catálogo, checkout (Stripe + Mercado Pago), assinaturas recorrentes, player de vídeo com URL assinada (Mux/Bunny), progresso do aluno, certificados com verificação pública, painel admin/instrutor e filas assíncronas (BullMQ) para emails, certificados e webhooks de vídeo.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend/Backend | Next.js 14 (App Router, Server Actions) + TypeScript + Tailwind |
| Auth | Auth.js v5 (Credentials + Google), sessão JWT com `role` |
| Banco | PostgreSQL 16 + Prisma 5 |
| Filas | Redis + BullMQ (processo worker separado) |
| Pagamentos | Stripe (cartão) + Mercado Pago (Pix/boleto/cartão) |
| Vídeo | Mux (recomendado) ou Bunny Stream, HLS com URL assinada |
| Emails | Resend (via fila) |
| Testes | Vitest + Testcontainers (Postgres real) |
| Deploy | Vercel (web) + Railway/Render (Postgres, Redis, workers) |

## Início rápido

Pré-requisitos: Node 20+, Docker, npm.

```powershell
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d   # Postgres :5432 + Redis :6379
npm install
npx prisma migrate dev                             # cria/atualiza o banco local
npm run dev                                        # web em http://localhost:3000
# em outro terminal:
npm run dev:workers                                # workers BullMQ
```

O `.env` já vem com placeholders dummy válidos para desenvolvimento (ver `docs/DESENVOLVIMENTO.md`). Chaves reais de produção vivem em GitHub Secrets / Vercel / Railway — nunca no repositório.

## Criar o administrador

O `scripts/seed-admin.ts` cria (ou promove) um `ADMIN` lendo tudo de variáveis de ambiente — nenhum segredo fica no código:

```powershell
$env:ADMIN_NAME = "Seu Nome"
$env:ADMIN_EMAIL = "voce@seusite.com"
$env:ADMIN_PASSWORD = "uma-senha-forte-aqui"   # mín. 8 caracteres
npx tsx scripts/seed-admin.ts
# saída esperada: ADMIN OK: <email> (ADMIN)
```

Se o email já existir, ele atualiza nome/senha e promove a `ADMIN` (upsert — seguro rodar de novo). Entre em `/login` com esse email/senha para acessar `/admin`. No deploy local em produção, o `scripts/prod-up.ps1` já executa o seed sozinho com o `ADMIN_*` do `.env.production` (ver `docs/DEPLOY-LOCAL-PROD.md`).

## Scripts

| Script | O quê |
|---|---|
| `npm run dev` / `dev:web` | Next.js em desenvolvimento |
| `npm run dev:workers` / `start:workers` | Workers BullMQ (`tsx workers/index.ts`) |
| `npm run build` | `prisma generate && next build` (validado: 22/22 páginas) |
| `npm run type-check` / `npm run lint` | `tsc --noEmit` / ESLint 9 (flat config) |
| `npm run test` / `test:watch` / `test:coverage` | Vitest (exige Docker p/ Testcontainers) |
| `npm run db:migrate` / `db:deploy` / `db:studio` | Atalhos do Prisma |

## Estrutura

```
app/
├── page.tsx                    # vitrine (cursos publicados)
├── (auth)/                     # login, cadastro, recuperar/redefinir senha
├── (dashboard)/                # meus-cursos, curso/[slug], certificados
├── (admin)/admin/              # cursos (CRUD), alunos — só ADMIN/INSTRUCTOR
├── checkout/                   # checkout/[slug] e checkout/sucesso
├── planos/                     # planos de assinatura
├── certificados/verificar/     # verificação pública de certificado
└── api/
    ├── auth/[...nextauth]/     # Auth.js
    ├── checkout/stripe|mercadopago(+/subscription)
    ├── webhooks/stripe|mercadopago|mux
    ├── lessons/[id]/playback-url|progress
    └── admin/lessons/[id]/upload
lib/          # prisma, auth, access, stripe, mercadopago, resend,
              # certificados, vídeo (mux/bunny), storage, queue/
workers/      # email, certificate, video + index + dashboard (Bull Board)
prisma/       # schema.prisma + migrations/
tests/        # setup (Testcontainers) + actions/* + webhooks/*
components/   # VideoPlayer, CheckoutButton, ModuleList (dnd-kit), …
infra/        # docker-compose.yml (Postgres + Redis)
.github/workflows/  # pr.yml, deploy-staging.yml, deploy-production.yml
docs/         # documentação detalhada (índice abaixo)
frontend/     # clientes desacoplados: shared/ (tipos+API), web/ (painel Vite),
              # mobile/ (app Expo) — ver frontend/README.md
```

## Documentação

| Doc | Conteúdo |
|---|---|
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Diagrama, grupos de rotas, libs, modelo de dados, decisões |
| [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) | Setup local, `.env`, migrations, convenções de código |
| [docs/AUTENTICACAO.md](docs/AUTENTICACAO.md) | Auth.js, middleware, roles, recuperação de senha |
| [docs/PAGAMENTOS.md](docs/PAGAMENTOS.md) | Stripe + Mercado Pago, webhooks, idempotência, assinaturas |
| [docs/VIDEO-E-CERTIFICADOS.md](docs/VIDEO-E-CERTIFICADOS.md) | Upload Mux, URL assinada, progresso, certificados |
| [docs/FILAS.md](docs/FILAS.md) | BullMQ: filas, workers, Bull Board, falhas |
| [docs/TESTES-E-CICD.md](docs/TESTES-E-CICD.md) | Vitest/Testcontainers, workflows, secrets, rollback |
| [docs/RELATORIO-TESTES.md](docs/RELATORIO-TESTES.md) | Histórico de tudo que foi testado: suítes, bugs achados, smokes, builds |
| [docs/DEPLOY-PRODUCAO.md](docs/DEPLOY-PRODUCAO.md) | Runbook: Railway + Vercel, chaves live, seed, go-live |
| [docs/DEPLOY-LOCAL-PROD.md](docs/DEPLOY-LOCAL-PROD.md) | Instalação local em modo produção: scripts, compose prod, seed, operação |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Todas as alterações de frontend: pasta `frontend/`, painel admin reescrito, testes |
| [docs/MOBILE.md](docs/MOBILE.md) | App mobile completo: telas, design system, endpoints, player, downloads, checkout, EAS |
| [docs/THEME.md](docs/THEME.md) | Base do tema em todo o frontend: tokens, fontes, utilitários e sincronia |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Erros comuns (P1012, build, lint, Docker…) |

## Fluxos principais (resumo)

- **Compra:** aluno escolhe curso → checkout (Stripe/MP) → **webhook** cria `Payment` + `Enrollment` em transação → email de boas-vindas via fila. Nunca liberar acesso pela tela de sucesso.
- **Assinatura:** checkout `mode: subscription` (Stripe) ou Preapproval (MP) → webhooks de ciclo de vida (`invoice.paid`, `payment_failed`, `deleted`) atualizam `Subscription`; `hasAccessToCourse()` unifica matrícula + assinatura.
- **Aula:** aluno abre aula → `GET playback-url` valida acesso e gera URL assinada (4h) → player HLS envia progresso a cada 15s → 90% marca conclusão → fila de certificado → PDF + email.
- **Admin:** Server Actions com `requireRole` + `assertOwnsCourse`; upload de vídeo direto browser→Mux (resumível, sem passar pelo Next).

## Testes e CI/CD (resumo)

- Testes rodam contra Postgres real via Testcontainers (`tests/setup.ts`); suítes em `tests/actions` e `tests/webhooks`.
- `main` → produção (Vercel + Railway, aprovação manual, backup pré-migration); `develop` → staging; PRs → checks + preview Vercel. Detalhes em [docs/TESTES-E-CICD.md](docs/TESTES-E-CICD.md).

## Segurança (resumo)

Preços em centavos no backend; assinatura de webhook sempre validada; `gatewayChargeId` único (idempotência); `payment + enrollment` em `$transaction`; defesa em profundidade (middleware + `requireRole` nas actions); token de reset aleatório, 30 min, uso único; vídeo por URL assinada curta + `hasAccessToCourse`.

## Estado de validação

`tsc --noEmit` limpo · `eslint` sem erros · `prisma validate` + `generate` OK · `npm run build` OK (22/22 páginas). Testes exigem Docker (não executados em ambiente sem Docker).
