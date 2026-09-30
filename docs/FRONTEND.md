# Frontend — todas as alterações

Este documento consolida **tudo que mudou no frontend** do projeto em duas frentes:

- **Parte 1** — nova pasta `frontend/`: clientes desacoplados (painel Vite + app Expo + pacote compartilhado).
- **Parte 2** — reescrita do painel admin Next.js (`app/(admin)/`) seguindo `spec-frontend-painel-admin.md`.
- **Parte 3** — testes que cobrem o comportamento do painel.

Detalhe operacional de cada cliente em `frontend/README.md`; este doc registra decisões, estrutura e contratos.

---

## Parte 1 — Nova pasta `frontend/`

Clientes que consomem o backend Next.js via HTTP. O backend continua fonte de verdade (banco, webhooks, filas); aqui vivem só apresentação e chamadas de API.

```
frontend/
├── README.md      # como rodar cada cliente + contrato com o backend
├── shared/        # @plataforma/shared — tipos + client HTTP base
├── web/           # painel de controle (Vite + React 18)
└── mobile/        # app do aluno (Expo SDK 51 + React Native)
```

### 1.1 `shared/` — `@plataforma/shared` (privado, `file:../shared`)

| Arquivo | Conteúdo |
|---|---|
| `src/types.ts` | Tipos espelhando o Prisma: `User`, `Course`, `Module`, `Lesson`, `Enrollment`, `LessonProgress`, `Plan`, `Subscription`, `Certificate`, enums de status. **Manter sincronizado com `prisma/schema.prisma`.** |
| `src/api.ts` | `createApiClient({ baseURL, getToken })` com `get/post/put/del`, header `Authorization: Bearer` automático e erro tipado `ApiError`. |
| `src/index.ts` | Re-exporta tipos + client. |

### 1.2 `web/` — painel de controle (`@plataforma/web`)

Vite 5 + React 18 + React Router 6 + TanStack Query 5 + Tailwind 3. Dev em `:5173` (`VITE_API_URL` → backend).

| Área | Arquivos |
|---|---|
| Boot | `index.html`, `src/main.tsx` (StrictMode + QueryClient), `src/routes.tsx` |
| Auth | `src/contexts/AuthContext.tsx` (token em `localStorage`), `src/pages/Login.tsx` |
| Shell | `src/components/Layout.tsx` (sidebar), `src/components/ProtectedRoute.tsx` (exige token + roles `ADMIN`/`INSTRUCTOR`) |
| Telas | `Dashboard.tsx` (contadores), `Courses.tsx`, `CourseForm.tsx` (novo/editar), `Students.tsx`, `Plans.tsx` |
| API | `src/api/client.ts` (`useApi()` recria o client ao trocar o token) |

Rotas: `/login` (pública), `/` dashboard, `/cursos`, `/cursos/novo`, `/cursos/:id`, `/alunos`, `/planos` (protegidas). Build gera `dist/` estático (Vercel/Netlify).

### 1.3 `mobile/` — app do aluno (`@plataforma/mobile`, reescrito)

Expo Router (file-based, `app/`) + estética do mockup + TanStack Query + `expo-av` + JWT em SecureStore. Entrada `index.js` → `expo-router/entry`. Tokens visuais em `src/theme/tokens.ts` (fundo `#1E1830`, acento roxo `#9B5DE5`, Bebas Neue + Inter — o mockup prevaleceu sobre o vermelho Netflix da spec).

| Área | Arquivos |
|---|---|
| Auth | `src/auth/{session.ts,SessionProvider.tsx}` + `(auth)/onboarding|login|cadastro|recuperar-senha` |
| Navegação | `app/_layout.tsx` (Stack com guard de sessão), `(tabs)/_layout.tsx` (5 abas: Início, Buscar, Downloads, Minha Lista, Perfil) |
| Mockup | `(tabs)/home` (hero + carrosséis), `curso/[slug]` (banner, CTA, módulos expansíveis, relacionados), `player/[lessonId]` (player + overlay próxima aula) |
| Demais telas | `(tabs)/busca|downloads|minha-lista|perfil`, `checkout/[courseId]` (modal → navegador do sistema) |
| Componentes | `CourseCard` (progresso), `CourseCarousel`, `HeroBanner`, `NextEpisodeOverlay`, `Screen`, `AuthForm` |
| Libs | `api/{client,queries}.ts`, `query/query-client.ts` (stale 5min), `downloads/`, `checkout/` (`expo-web-browser`), `push/` (registro Expo Push) |
| Build | `eas.json` (development/staging/production) |

`npm install` ainda não foi executado em `mobile/` (scaffold revisado sem `node_modules` do Expo).

### 1.4 Backend mobile (implementado)

Auth via **JWT + SecureStore** (`lib/mobile-auth.ts`: `signMobileToken`/`getTokenUser`, `JWT_SECRET` no `.env` — dummy local, real em produção). Endpoints em `app/api/mobile/`: `login`, `signup`, `password-reset` (reusa o fluxo web), `home` (agregado: hero + 4 seções em 1 chamada), `courses` (`?q=`), `courses/[slug]` (detalhe + `hasAccessToCourse` + relacionados), `courses/by-id/[id]`, `certificates`, `plans`. Reutilizados do web: `playback-url`, `progress`, checkout Stripe/MP. Pendentes (produto/infra): CORS p/ o Vite, IAP da Apple antes de escalar iOS, push via BullMQ.

---

## Parte 2 — Reescrita do painel admin Next.js

Alvo da especificação: o admin **do próprio app Next.js** (Server Actions como mutação), não o Vite. Rotas finais:

```
/admin                  → dashboard (NOVO)
/admin/cursos           → tabela (reescrita)
/admin/cursos/novo      → formulário RHF (reescrito)
/admin/cursos/[id]      → editor em tabs (reescrito)
/admin/cursos/[id]/aulas/[lessonId]  → editor da aula (reescrito)
/admin/alunos           → tabela com busca/filtros (reescrita)
/admin/financeiro       → NOVO (só ADMIN)
/admin/planos           → NOVO (só ADMIN)
/admin/config           → NOVO (só ADMIN)
```

### 2.1 Design system (seção 1 da spec)

- `lib/admin/tokens.ts` — `adminColors` (fundo `#FAFAF9`, acento roxo `#6D4FC7`, `success/warning/danger`, bloco `dark`) e `adminTypography` (Inter, 22/16/14/12/13). (A spec previa `packages/ui/…`; neste repo single-app vivem em `lib/admin/`.)
- `app/globals.css` — CSS variables `:root` + `.dark` (opt-in).
- `tailwind.config.ts` — `darkMode: "class"` + cores mapeadas (`bg-surface`, `border-adminBorder`, `text-textPrimary`, `text-accent`, `bg-accentMuted`, `text-success`…) + Inter.
- Princípios aplicados: densidade em tabelas, exclusão com digitação do nome (`ConfirmDeleteDialog`), vazio com ação (`DataStateWrapper` + `EmptyActionLink`).

### 2.2 Dependências adicionadas (painel)

`@tanstack/react-table@8` (fixado — o npm resolveu a v9 beta, cuja API quebrou; ver §2.7), `react-hook-form`, `@hookform/resolvers`, `sonner`, `recharts`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@tiptap/react` + `@tiptap/starter-kit`, Radix `dialog/dropdown-menu/tabs/switch/select/label/slot` (select instalado para uso futuro; filtros usam `<select>` nativo).

### 2.3 Shell: layout, sidebar, topbar

- `app/(admin)/layout.tsx` — guarda `ADMIN`/`INSTRUCTOR` (redirect `/login?callbackUrl=/admin`), shell `sidebar + topbar + main rolável`, `<Toaster richColors>`.
- `components/AdminSidebar.tsx` — `NAV_ITEMS` com `roles` (instrutor: Dashboard + Cursos; resto só `ADMIN`), ativo destacado, `usePathname`, `max-md:hidden`.
- `components/admin/AdminTopbar.tsx` — busca global (visual), sino, toggle dark-mode (`.dark` no `<html>`), avatar, drawer mobile com a mesma sidebar.

### 2.4 Dashboard (`admin/page.tsx`)

`StatCard` (label, valor, tendência % vs mês anterior), `RevenueChart` (Recharts, 30 dias, BRL), `TopCoursesTable` (link p/ editor). Dados em `lib/admin/queries.ts → getDashboardStats()` (agregações `Payment` só `PAID` + `Enrollment` + `Course`, **escopo por instrutor** via `courseScope()`).

### 2.5 Cursos (`cursos/page.tsx`, `CoursesTable.tsx`)

TanStack Table ordenável: thumbnail + título, `StatusBadge` (PT-BR: Publicado/Rascunho/…), preço via `formatCurrency` (centavos→BRL), nº de alunos (`_count`). Ações por linha (DropdownMenu): Editar, Publicar (só `DRAFT`, via `handleAction` + `router.refresh()`), Excluir (abre `ConfirmDeleteDialog`). `NewCourseButton`; página `novo/` usa `NewCourseForm` (RHF + `courseSchema`, cria e navega ao editor).

### 2.6 Editor do curso (`[id]/page.tsx`, tabs)

Header com título + status; tabs Informações/Currículo/Preço/Configurações (Radix Tabs):
- `CourseInfoForm` — RHF + `zodResolver(courseSchema)` (**mesmo schema da Server Action**, em `lib/validation/course.ts`), descrição em `RichTextEditor` (Tiptap: negrito, listas, link), preço viaja hidden (action valida o objeto completo).
- `CurriculumBuilder` — dnd-kit nos módulos, `ModuleAccordion` (grip + `EditableTitle` inline + contador de aulas), `LessonRow` (link p/ editor da aula + `VideoStatusBadge`: Sem vídeo/Pronto), criar módulo/aula com toast + refresh. Substitui o antigo `ModuleList.tsx` (removido).
- `CoursePricingForm` — input em R$ (pt-BR) convertido p/ centavos.
- `CourseSettingsForm` — status, publicar, zona de risco com `ConfirmDeleteDialog` (após excluir, volta à lista).

### 2.7 Editor da aula (`aulas/[lessonId]/`)

Página server (voltar ao curso + `LessonEditorForm` client): título inline (`updateLessonTitle`), `VideoUploader` existente ou `VideoPreviewWithReplace` (badge + substituir), `Switch` de preview (`toggleFreePreview`).

### 2.8 Alunos, financeiro, planos e configuração

- `alunos/page.tsx` — form GET server-side: busca nome/email (`q`) + filtro por curso; `StudentsTable` (nome, email, curso, status, **progresso %**, data) + modal de detalhes com **Revogar acesso** (`ADMIN`, edge case de reembolso).
- `financeiro/page.tsx` (só `ADMIN`, redirect p/ `/admin` caso contrário) — filtros GET (período 7/30/90d + gateway), `StatCard`s (receita no período/total, ativas + em atraso, MRR, churn), `SubscriptionsTable` (cancelar com confirmação; acesso vale até `currentPeriodEnd`, cancelar também no gateway), `PaymentsTable` + `ExportCsvButton` (CSV `;` p/ conciliação). `getFinanceOverview({ days, gateway })`.
- `planos/` — CRUD completo (só `ADMIN`): `page.tsx` com `PlansTable` (editar/excluir com confirmação; exclusão bloqueada com assinaturas vinculadas), `novo/` e `[planId]/` com `PlanForm` (nome, preço R$, intervalo, Stripe Price ID, MP plan ID, todos-os-cursos + checkboxes de cobertura, tudo em transação). Actions em `planos/actions.ts`.
- `config/page.tsx` (só `ADMIN`) — `GatewayCard` por gateway (Stripe/MP): status Ativo/Desligado, modo Live/Teste/Sem chave, chave mascarada, URL de webhook p/ cadastrar, switch liga/desliga (persiste em `SystemSetting`, respeitado pelos 4 checkouts com 503), botão Testar conexão (Stripe: `balance.retrieve`; MP: lista meios de pagamento). Segredos seguem em env vars — a tela nunca exibe nem grava segredo.

### 2.9 Base nova em `lib/`

| Arquivo | Papel |
|---|---|
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge, padrão shadcn) |
| `lib/admin/tokens.ts` | paleta + tipografia |
| `lib/admin/format.ts` | `formatCurrency` (centavos→BRL), datas pt-BR |
| `lib/validation/course.ts` | `courseSchema` + `CourseFormData` — **fonte única** (actions + forms importam daqui) |
| `lib/admin/queries.ts` | `getDashboardStats`, `getCoursesForAdmin`, `getCourseWithModules` (checa dono), `getLessonWithStatus`, `getEnrollmentsForAdmin` (progresso %), `getFinanceOverview({ days, gateway })`, `getPlansForAdmin` — todas com `currentStaff()` + escopo |
| `lib/admin/gateways.ts` | `isGatewayEnabled`/`setGatewayEnabledRaw` (`SystemSetting`, default ligado), `getGatewayStatusList` (mascarado), `testStripeConnection`/`testMercadoPagoConnection` |
| `lib/admin/action-feedback.ts` | `handleAction(action, msg)` — único padrão de toast (client) |
| `components/ui/*` | `button` (cva + variants incl. `accent/destructive`), `input`, `label`, `badge` (+`danger`), `dialog`, `dropdown-menu`, `tabs`, `switch` — estilo shadcn sobre Radix |

### 2.10 Actions novas/alteradas

- `cursos/actions.ts` — importa `courseSchema` de `lib/validation/course.ts` (assinaturas **inalteradas** — testes intactos).
- `[id]/actions.ts` — novas: `updateModuleTitle`, `updateLessonTitle`, `toggleFreePreview` (validam título, checam dono, revalidam), `revokeEnrollment` (só `ADMIN` → `CANCELED`); `createModule`/`reorderModules`/`createLesson` agora retornam `{ success }` p/ o `handleAction`.

### 2.11 Adaptações honestas à spec

- `packages/ui/*` e `packages/shared-types/*` → `lib/admin/*` e `lib/validation/*` (repo single-app, sem monorepo).
- `VideoStatusBadge` sem estado "Processando" (o schema não tem o campo; `videoAssetId` nulo = Sem vídeo).
- Responsividade §10 parcial: drawer + sidebar colapsada aplicadas; tabelas usam scroll horizontal (`overflow-x-auto`) — cards empilhados (`CardListView`) ficam como follow-up.
- `useMediaQuery` em `components/admin/useMediaQuery.tsx` (disponível p/ o follow-up).

---

## Parte 3 — Testes do painel

Novos, contra Postgres real (Testcontainers), em `tests/`:

- `actions/admin-curriculum.test.ts` (9): ordem de módulos/aulas, atomicidade do reorder, validação de título, toggle de preview, proteção cruzada entre instrutores, revogação (`ADMIN` ok / instrutor 403).
- `queries/admin-dashboard.test.ts` (6): escopo instrutor×admin, `STUDENT` bloqueado, receita só `PAID`, `PENDING` excluído, progresso 50%.

Correções de infra reveladas pelos testes: `lib/prisma.ts` virou Proxy lazy (client prendia a `DATABASE_URL` do `.env` no import e os testes nunca atingiam o container), `pool: "forks"` no Vitest, mock de `next/cache` nos testes de actions, webhook Stripe lendo `req.headers`. Resultado: **26/26 verdes** + smoke HTTP (`/admin/*` → 307 sem login, `/login` e verificação pública 200, webhook inválido 400).
