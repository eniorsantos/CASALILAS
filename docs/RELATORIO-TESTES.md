# Relatório de testes — histórico completo

Registro de **tudo que foi testado** no projeto: suíte Vitest (4 execuções), validações estáticas, builds, smoke tests HTTP (2 rodadas) e tipagem do mobile. Estratégia e CI em [TESTES-E-CICD.md](TESTES-E-CICD.md).

Ambiente: Windows, Node 22.17.1, Docker 29.7.2, Postgres 16 (Testcontainers, portas 327xx), Postgres/Redis locais (`:5432`/`:6379`).

## 1. Suíte Vitest — inventário (estado final: 26/26)

| Arquivo | Testes | Cobre |
|---|---|---|
| `tests/webhooks/stripe.test.ts` | 3 | pagamento+matrícula, idempotência (evento 2× = 1 payment), assinatura inválida → 400 |
| `tests/webhooks/mercadopago.test.ts` | 1 | Pix `pending` não cria matrícula |
| `tests/actions/course.test.ts` | 3 | `createCourse`: sucesso (slug + `DRAFT`), título curto, preço negativo |
| `tests/actions/course-ownership.test.ts` | 1 | instrutor não edita curso alheio |
| `tests/actions/password-reset.test.ts` | 3 | token válido / expirado / reutilizado |
| `tests/actions/admin-curriculum.test.ts` (novo) | 9 | ordem de módulos/aulas, atomicidade do reorder, validação de título, toggle preview, proteção cruzada, revogação (`ADMIN` ok / instrutor 403) |
| `tests/queries/admin-dashboard.test.ts` (novo) | 6 | escopo instrutor×admin, `STUDENT` bloqueado, receita só `PAID`, `PENDING` excluído, progresso 50% |

Comando: `npm run test` (exige Docker; cada arquivo ganha seu container via `pool: "forks"`).

## 2. Histórico das execuções

| # | Resultado | O que aconteceu |
|---|---|---|
| 1 | **12/26** (4 arquivos falhando) | Primeira execução com Docker. Classes de falha: (a) 8× `revalidatePath` fora de request scope; (b) 3× `headers()` fora de request scope; (c) 1× mock apagado pelo `resetAllMocks`; (d) 2× "impossíveis" (contagem 0 com dado existente) |
| debug | 1/1 (scratch, removido depois) | Isolou a classe (d): queries diretas passam — problema era ambiente, não lógica |
| 2 | **25/26** | Após as 4 correções (§3); restou 1× FK (`user_1` inexistente no teste) |
| 3 | 4/4 (alvo: `course` + `ownership`) | Confirmou as correções nesses arquivos |
| 4 | **26/26** (7 arquivos, ~130s) | Suíte final verde |

## 3. Bugs reais encontrados pelos testes (todos corrigidos)

1. **Testes nunca atingiam o Testcontainers (grave).** O singleton do Prisma era construído no `import`, lendo a `DATABASE_URL` do `.env` local; o setup só trocava a env depois, no `beforeAll`. As 7 suítes disputavam o Postgres local com corridas entre arquivos. Fix: `lib/prisma.ts` virou Proxy lazy (constrói no primeiro uso; idêntico em prod) + `pool: "forks"`. ⚠️ Efeito colateral: execuções anteriores truncaram as tabelas do banco local de dev — a partir do fix, os testes são herméticos.
2. **Webhook Stripe usava `next/headers`** (quebra fora de request scope e era intestável). Fix: `req.headers.get("stripe-signature")` — idêntico em produção.
3. **`resetAllMocks()` do setup apagava mocks de fábrica** — `course.test.ts` agora restabelece o mock no `beforeEach` local (mesmo padrão de `course-ownership`).
4. **`revalidatePath` fora de escopo** — mock de `next/cache` nos 2 arquivos de actions.
5. **Mock `user_1` inexistente** — com a FK enforced, o teste cria o instrutor antes de chamar `createCourse`.

## 4. Validações estáticas

| Check | Resultado |
|---|---|
| `tsc --noEmit` (backend/admin) | limpo (repetido após cada mudança) |
| `tsc --noEmit` (`frontend/mobile`, após `npm install` — 1211 pacotes) | 2 erros corrigidos: `contentFit`→`resizeMode` no `ImageBackground`, `shouldShowAlert` no handler de push (API da v0.28); depois limpo |
| `tsc --noEmit` (`frontend/shared`) | limpo |
| `eslint app components lib workers` | 0 erros; 2 warnings informativos (`react-compiler/incompatible-library` em RHF/TanStack — esperado); 2 erros reais corrigidos no caminho (`no-assign-module-variable`, `set-state-in-effect`) |
| JSONs (`package.json` ×3, `app.json`, `eas.json`, `tsconfig`) | parse OK |

## 5. Builds

`npx next build`: **26/26 páginas, 0 erros**, repetido após painel admin, endpoints mobile e correções de rotas. Tabela de rotas gerada inclui as 22 páginas + 20 APIs (9 mobile). Único aviso: `can't resolve '@valkey/valkey-glide'` (dependência opcional do próprio BullMQ, inofensivo).

## 6. Smoke tests HTTP (dev server, 2 rodadas; servidor encerrado após)

Rodada 1 (admin): `/login` 200; `/admin`, `/admin/cursos`, `/admin/financeiro`, `/admin/planos` → 307 (middleware); `/certificados/verificar/abc123` 200; `/planos` 200; webhook Stripe inválido → 400.

Rodada 2 (auditoria completa):
- Públicas 200 (8/8): `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/planos`, `/checkout/sucesso`, `/certificados/verificar/abc123`.
- Protegidas → 307 sem login (12/12): `/meus-cursos`, `/curso/xyz`, `/certificados`, 8× `/admin/*`.
- Mobile sem token → 401 (7/7: `home`, `courses`, `courses/nope`, `by-id/x`, `certificates`, `plans`); `signup` inválido → 400; `login` errado → 401; `password-reset` → 200.
- Lessons/checkout/admin-upload sem auth → 401 (após fix §7); webhooks MP → 200, Mux → 200; `api/auth/providers` → 200.

## 7. Correções aplicadas durante os smoke tests

| Achado | Fix | Verificação |
|---|---|---|
| `GET /checkout/[slug-inexistente]` → 500 | `findUnique` + `notFound()` | re-probe → **404** |
| `POST /api/admin/lessons/[id]/upload` sem auth → 500 | `try/catch` no `requireRole` → 401 | re-probe → **401** (+ `tsc` limpo) |

## 8. Como reproduzir

```powershell
npm run type-check          # tsc backend+admin
npm run lint                # eslint (0 erros)
npm run build               # 26/26
npm run test                # Vitest, exige Docker (~2 min, 7 containers)
cd frontend/mobile; npm run type-check   # tsc do app
# Smoke: npm run dev + probes da §6 (matriz acima), depois encerrar o server
```

## 9. Lacunas (não coberto — follow-ups)

- Testes de componentes client (Tabelas, `CurriculumBuilder`, `CourseInfoForm`, telas Expo) com Testing Library — backend do painel está coberto, UI não.
- Execução real do app em device/emulador + build EAS (só `tsc` + revisão foram feitos no mobile).
- Testes de carga/estresse nas filas e webhooks; teste de expiração da URL assinada (4h).
- Cobertura (`test:coverage`) nunca rodada — sem threshold configurado.
