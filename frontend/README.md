# Frontend — painel web + app mobile

Pasta de desenvolvimento dos clientes que consomem o backend Next.js (raiz do repo). O backend continua sendo a fonte de verdade (banco, webhooks, filas); aqui vivem só apresentação e chamadas HTTP.

```
frontend/
├── shared/    # @plataforma/shared — tipos (espelho do Prisma) + client HTTP base
├── web/       # painel de controle (Vite + React + React Router + TanStack Query + Tailwind)
└── mobile/    # app do aluno (Expo Router + estética do mockup, JWT + SecureStore)
```

## Rodando

```powershell
# Painel web (http://localhost:5173)
cd frontend/web
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev

# App mobile (Expo Go / dev client)
cd frontend/mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://localhost:3000
npm install
npx expo start         # escaneie o QR no Expo Go (mesmo Wi-Fi do PC)
```

> No celular físico, `localhost` não resolve — use o IP da sua máquina na `EXPO_PUBLIC_API_URL` (ex.: `http://192.168.0.10:3000`).

## Telas/rotas

| Web (`/`) | Mobile (Expo Router) |
|---|---|
| `/login` | `(auth)/onboarding`, `/login`, `/cadastro`, `/recuperar-senha` |
| `/` Dashboard (contadores) | `(tabs)/home` — hero + carrosséis (mockup tela 1) |
| `/cursos`, `/cursos/novo`, `/cursos/:id` | `(tabs)/busca` — busca + grid |
| `/alunos` | `/curso/[slug]` — banner, CTA, módulos expansíveis (mockup tela 2) |
| `/planos` | `/player/[lessonId]` — player + próxima aula (mockup tela 3) |
| | `(tabs)/downloads`, `(tabs)/minha-lista`, `(tabs)/perfil`, `/checkout/[courseId]` |

Visual do app = `mockup-telas-app.html` (fundo `#1E1830`, acento roxo `#9B5DE5`, Bebas Neue + Inter), tokens em `mobile/src/theme/tokens.ts`.

O player mobile consome a mesma URL assinada do backend (`GET /api/lessons/[id]/playback-url`) e envia progresso a cada 15s (`POST .../progress`), igual ao `VideoPlayer` web.

## Integração com o backend (implementado)

Auth mobile via **JWT + SecureStore** (nunca cookie): `POST /api/mobile/login` e `/signup` retornam `{ token, user }`; `lib/mobile-auth.ts` (`getTokenUser`) protege as rotas. Endpoints JSON em `app/api/mobile/`: `home` (agregado: hero + 4 seções em 1 chamada), `courses` (busca `?q=`), `courses/[slug]` (detalhe + acesso + relacionados), `courses/by-id/[id]`, `certificates`, `plans`, `password-reset`. Reutilizados do web: `playback-url`, `progress` e checkout Stripe/MP (aberto no **navegador do sistema** via `expo-web-browser`, sem IAP no MVP).

`JWT_SECRET` em `.env` (dummy local; **produção exige valor real**). Pendentes (decisão de produto/infra, não código): CORS p/ a origem do Vite, política de IAP da Apple antes de escalar iOS, push via fila BullMQ (scaffold em `mobile/src/push/`).

## Deploy

- **Web:** `npm run build` gera `dist/` estático → Vercel/Netlify (ou servir junto ao backend). `VITE_API_URL` aponta para a API de produção.
- **Mobile:** `eas build` (EAS) para `.apk`/`.aab`/iOS; `EXPO_PUBLIC_API_URL` fixada no build para a API de produção.
