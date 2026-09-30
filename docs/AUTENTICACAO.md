# Autenticação e autorização

## Auth.js v5 (`auth.ts`)

- Adapter Prisma, sessão **JWT** (funciona com Credentials + Edge middleware).
- Providers: **Google** (OAuth) e **Credentials** (email/senha com `bcrypt.compare`; retorna `null` se o usuário só tem login social).
- Callbacks injetam `role` no JWT e na sessão — permissões sem ir ao banco a cada checagem.
- Páginas customizadas: `signIn`/`error` → `/login`. Handler em `app/api/auth/[...nextauth]/route.ts`.

## Cadastro (`app/(auth)/cadastro/actions.ts`)

Validação Zod → verifica email duplicado → `bcrypt.hash` (12 rounds) → cria como `STUDENT`.

## Recuperação de senha

1. `requestPasswordReset(email)` — **resposta idêntica exista ou não o email** (anti-enumeração); token `crypto.randomBytes(32)`, expira em 30 min; link vai pela fila (`password-reset-email`).
2. `resetPassword(token, newPassword)` — rejeita token inexistente, expirado ou já usado; atualiza senha + marca `usedAt` **em transação** (uso único). Schema: `PasswordResetToken`.

## Proteção de rotas (`middleware.ts`)

| Rota | Regra |
|---|---|
| `/admin/*` | logado + `ADMIN`/`INSTRUCTOR`, senão `/login` |
| `/meus-cursos/*`, `/curso/*` | logado, senão `/login?callbackUrl=…` |
| `/login`, `/cadastro` | logado é redirecionado a `/meus-cursos` |

`matcher` cobre exatamente esses prefixos.

## Autorização nas actions (`lib/auth.ts`)

`requireRole(["ADMIN","INSTRUCTOR"])` em **toda** Server Action de admin — o middleware protege a navegação, mas actions são endpoints HTTP e precisam da própria checagem (defesa em profundidade). `assertOwnsCourse()` (`app/(admin)/admin/cursos/actions.ts`): `ADMIN` vê tudo; `INSTRUCTOR` só os próprios cursos — usado em update/publish/módulos.

## Painel admin (resumo)

- `app/(admin)/layout.tsx` — guarda + `AdminSidebar`.
- `admin/cursos/` — lista, `novo` (`createCourse`: slug via `slugify`, nasce `DRAFT`), `[id]` (editar + `publishCourse` exige ≥1 módulo; `deleteCourse` só `ADMIN`).
- Módulos/aulas: `createModule`, `reorderModules` (transação atômica p/ drag-and-drop), `createLesson`; `ModuleList` (dnd-kit) e `VideoUploader` (upchunk direto ao Mux).
- `admin/alunos/` — últimas 50 matrículas com status.

## Checklist

- [ ] Toda action de admin chama `requireRole` antes de tocar no banco
- [ ] Instrutor restrito aos próprios cursos; delete só `ADMIN`
- [ ] Resposta de recuperação idêntica com/sem email cadastrado
- [ ] Token de reset: aleatório, 30 min, uso único
- [ ] `matcher` do middleware cobre todas as rotas sensíveis
- [ ] Reordenação em transação; upload direto browser→Mux (nunca via Next)
