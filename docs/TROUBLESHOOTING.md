# Troubleshooting

## `P1012: DATABASE_URL resolved to an empty string`

O Prisma valida o datasource em **qualquer** comando. Causa: `.env` com `DATABASE_URL=` vazia (ou sem `.env`).

```powershell
cp .env.example .env   # o .example já traz placeholders dummy válidos
npx prisma validate    # deve responder "is valid"
```

## `next build` tenta conectar no banco / falha no prerender

Páginas que leem o Prisma precisam de `export const dynamic = "force-dynamic"` no topo (já aplicado em todas as páginas de dados). Sem isso, o Next executa a query no build e falha sem DB vivo. Rotas API são dinâmicas por padrão.

## `next lint` quebra com ESLint 9 (`Invalid Options: useEslintrc…`)

O `next lint` embutido do Next 14 só entende ESLint 8. Solução adotada: lint separado (`npm run lint` → `eslint .` com flat config `eslint.config.mjs`) + `eslint.ignoreDuringBuilds: true` no `next.config.mjs`. Não reverter para `next lint` sem fixar `eslint@8`.

## Aviso `Can't resolve '@valkey/valkey-glide'` (BullMQ)

Dependência opcional do próprio pacote BullMQ; warning de compilação inofensivo, não falha o build. Ignorar (ou, se incomodar, adicionar o pacote).

## Avisos Edge Runtime (`bcryptjs`, `jose` no middleware)

`middleware.ts` importa `auth.ts`, que puxa bcrypt/jose (APIs Node). São só avisos — o middleware compila e roda. Se virarem erro em upgrade do Next, mover a leitura de sessão para JWT puro no middleware.

## `npm run test` falha no `beforeAll`

Testcontainers precisa de **Docker rodando**. Sem Docker, os testes de integração não executam — esperado, não é bug do código. CI (GitHub Actions) usa o service Postgres em vez de Testcontainers? Não — o setup usa Testcontainers; no CI o `DATABASE_URL` do service é sobrescrito pelo container efêmero do setup. Manter Docker ativo localmente.

## `prisma migrate dev` detecta drift / cria migration inesperada

O baseline `000_init/` foi escrito à mão; se o schema divergir, o Prisma gera migration de ajuste (ex.: `20260918225225_init`). Fluxo: revisar o SQL gerado antes de aplicar; nunca editar migration já aplicada em staging/prod (criar nova).

## Workers não processam / `Redis connection refused`

- Redis no ar? `docker compose -f infra/docker-compose.yml ps`; `REDIS_URL` correta no `.env`?
- Workers rodando? `npm run dev:workers` em terminal separado (dev) ou processo Railway (prod).
- Ver Bull Board `:3001/admin/queues` (proteger com auth).

## Checkout/webhook retorna 4xx em dev

- Stripe: `STRIPE_SECRET_KEY` de **teste** + `stripe-signature` válida (use `stripe listen --forward-to` para testar local).
- MP: token de **teste**; lembre que `pending` (Pix) responde 200 **sem** criar matrícula — comportamento correto.
- Mux: sem credenciais, o upload falha — dummies do `.env` servem só p/ build, não p/ uso real.

## Porta em uso / `.next` corrompido

```powershell
# porta 3000 ocupada: npm run dev -- -p 3001
Remove-Item -Recurse -Force .next; npm run dev
```
