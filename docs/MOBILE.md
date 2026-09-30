# App Mobile — documentação completa

Cliente do aluno (Android/iOS) em **Expo SDK 51 + Expo Router**, estética do `mockup-telas-app.html`, consumindo o backend Next.js via `app/api/mobile/*` com **JWT + SecureStore**. Escopo implementado: `frontend/mobile/` (36 arquivos) + 9 endpoints backend + `lib/mobile-auth.ts`.

Guias relacionados: [spec-app-mobile-netflix.md](../spec-app-mobile-netflix.md) (decisões), [FRONTEND.md](FRONTEND.md) (visão geral dos frontends), [PAGAMENTOS.md](PAGAMENTOS.md) (checkout), [VIDEO-E-CERTIFICADOS.md](VIDEO-E-CERTIFICADOS.md) (URL assinada, progresso).

## 1. Stack e decisões

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | React Native + Expo (~51) + Expo Router (~3.5) | Reuso de TS/tipos com o backend; EAS p/ build |
| Navegação | Expo Router file-based (`app/`) | Rotas = arquivos; guard de sessão central no `_layout` |
| Estado server | TanStack Query 5 (`staleTime` 5 min catálogo) | Cache em rede móvel; progresso/matrícula sempre frescos |
| Auth | JWT 30 dias + `expo-secure-store` (nunca cookie) | Cookie web não existe no device |
| Player | `expo-av` (MVP) | HLS via URL assinada; `react-native-video` como upgrade futuro |
| Imagens | `expo-image` (cache em disco) | Carrosséis com dezenas de thumbnails |
| Fontes | Bebas Neue (display) + Inter (corpo) via Google Fonts + SplashScreen | Fidelidade ao mockup |
| Ícones | `@expo/vector-icons` (Ionicons) | Já vem com o Expo, sem install extra |
| Checkout | `expo-web-browser` (navegador do sistema) | Sem IAP/comissão no MVP (decisão §7) |
| Downloads | `expo-file-system` + índice JSON com expiração | Offline (diferencial BR) |
| Push | `expo-notifications` (registro + handlers; disparo via fila — §8) | Reengajamento |

**Decisão visual registrada:** a spec sugeria vermelho Netflix (`#E50914` sobre `#141414`), mas o mockup — referência final — define marca roxa em fundo arroxeado. O app segue o mockup: fundo `#1E1830`, superfície `#2A2340`/`#352C4D`, acento `#9B5DE5`, `primaryWarm` `#D9B8FF`, texto `#F5F3F8`/`#B3A9C2`. Tokens em `mobile/src/theme/tokens.ts`.

## 2. Estrutura

```
frontend/mobile/
├── package.json / app.json (plugin expo-router + scheme) / eas.json
├── index.js (expo-router/entry) / babel.config.js / tsconfig.json / .env.example
├── app/                          # rotas (Expo Router)
│   ├── _layout.tsx               # Stack + fontes + QueryClient + Session + guard
│   ├── (auth)/                   # onboarding, login, cadastro, recuperar-senha
│   ├── (tabs)/                   # home, busca, downloads, minha-lista, perfil
│   ├── curso/[slug].tsx          # detalhes (card)
│   ├── player/[lessonId].tsx     # player (fullScreenModal)
│   └── checkout/[courseId].tsx   # checkout (modal)
└── src/
    ├── theme/tokens.ts           # cores + tipografia do mockup
    ├── shared/                   # cópia interna de `@plataforma/shared` (tipos + client HTTP)
    ├── api/{client,queries}.ts   # client Bearer + hooks (home, detail, search, certs, plans)
    ├── auth/{session.ts,SessionProvider.tsx}  # login/signup/logout, usuário persistido
    ├── query/query-client.ts     # staleTime 5 min + FRESH_QUERY
    ├── components/{Screen,CourseCard,CourseCarousel,HeroBanner,NextEpisodeOverlay,AuthForm}
    ├── downloads/downloads.ts    # mp4 estático + índice + expiração 30d + limpeza
    ├── checkout/checkout.ts      # cria preferência e abre no navegador
    └── push/notifications.ts     # registro do Expo Push token + handlers
```

## 3. Inventário de telas (rota → arquivo → backend)

| Rota | Arquivo | Dados |
|---|---|---|
| `/(auth)/onboarding` | 3 slides + CTA | estático |
| `/(auth)/login` | `login.tsx` | `POST /api/mobile/login` → `{ token, user }` |
| `/(auth)/cadastro` | `cadastro.tsx` | `POST /api/mobile/signup` (409 se email existe) |
| `/(auth)/recuperar-senha` | `recuperar-senha.tsx` | `POST /api/mobile/password-reset` (resposta idêntica, anti-enumeração) |
| `(tabs)/home` | `home.tsx` | `GET /api/mobile/home` (hero + 4 seções em 1 chamada) |
| `(tabs)/busca` | `busca.tsx` | `GET /api/mobile/courses?q=` (a partir de 2 chars), grid 3 colunas |
| `(tabs)/downloads` | `downloads.tsx` | local (`listDownloads`, expiração, espaço usado) |
| `(tabs)/minha-lista` | `minha-lista.tsx` | seções "Continue assistindo"/"Meus cursos" do agregado |
| `(tabs)/perfil` | `perfil.tsx` | sessão local + `certificates` + `plans` + toggle + sair |
| `/curso/[slug]` | `curso/[slug].tsx` | `GET /api/mobile/courses/[slug]` (módulos expansíveis, `hasAccess`, concluídas, relacionados) |
| `/player/[lessonId]` | `player/[lessonId].tsx` | `GET /api/lessons/[id]/playback-url` + `POST .../progress` |
| `/checkout/[courseId]` | `checkout/[courseId].tsx` | `GET .../by-id/[id]` + checkout Stripe/MP no navegador |

Navegação (§4 da spec): Stack raiz com guard (`(auth)` ↔ `(tabs)` por sessão), tab bar escura com as 5 abas, detalhes em `card`, player em `fullScreenModal`, checkout em `modal`.

## 4. Autenticação

Fluxo: telas `(auth)` → `session.ts` (`login`/`signup` → SecureStore `plataforma.auth_token` + `plataforma.auth_user`) → `SessionProvider` (restaura sessão no boot, `ready` evita flash) → guard no `_layout` redireciona. Backend: `lib/mobile-auth.ts` (`signMobileToken` 30d, `getTokenUser` valida `Bearer`, `unauthorizedResponse`); login reutiliza a lógica do `authorize()` (bcrypt, `null` p/ só-social). `JWT_SECRET` no `.env` (dummy local, **real em produção**).

## 5. Player e progresso

`expo-av` com a **mesma URL assinada** do web (nada de `hls.js` no RN; `react-native-video` é o upgrade p/ qualidade adaptativa/DRM). Heartbeat de progresso a cada 15s (igual ao web); overlay `NextEpisodeOverlay` nos últimos 15s com countdown de 8s e cancelar. Controles: tap play/pause + nativos desligados (custom no MVP); barra fina roxa (mockup).

## 6. Downloads offline

Baixa o **mp4 estático** (não HLS) em `documentDirectory/downloads/`, índice JSON com `downloadedAt`/`expiresAt` (30 dias), limpeza de expirados ao listar, tela com espaço usado (`formatBytes`) e remover. Proteção honesta: AES local com chave `userId+deviceId` e revalidação de acesso ao abrir — **follow-up, não implementado** (hoje o arquivo fica em diretório privado do app, sem criptografia extra).

## 7. Checkout e IAP

MVP: modal com resumo → `POST /api/checkout/mercadopago` (ou página `/checkout/[slug]`) aberto em `expo-web-browser` (navegador do sistema, não WebView embutida). iOS **exige IAP p/ conteúdo digital consumido no app** (15–30%); abrir fora do app evita a comissão mas pode gerar rejeição na revisão — **validar compliance de App Store antes de escalar**; `react-native-iap` é o caminho nativo.

## 8. Push notifications

`registerForPush()` (permissão + canal Android + Expo Push token) e handler local prontos. Falta o disparo: novo job na fila BullMQ (ou tipo na fila `email`) chamando a Expo Push API — casos: renovação, curso novo, "continue de onde parou". Backend do disparo **não implementado**.

## 9. Build, envs e distribuição

```powershell
cd frontend/mobile
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://localhost:3000
npm install
npx expo start         # QR no Expo Go (mesmo Wi-Fi)
```

- **Celular físico:** `localhost` não resolve — usar IP da máquina (`http://192.168.0.10:3000`).
- `eas.json`: `development` (dev client), `staging` (`EXPO_PUBLIC_API_URL` staging), `production` (API prod).
- Backend em prod: `JWT_SECRET` real, `APP_URL` = domínio (links de verificação de certificado abertos do app).

### Gerar o APK/AAB Android (primeira vez — exige conta Expo)

O build roda na nuvem da Expo (15–40 min); o CLI só orquestra. Pré-requisitos já prontos: `eas-cli` funciona, `app.json` com `package`, `eas.json` com profiles.

```powershell
cd frontend/mobile
npx -y eas-cli@latest login        # conta Expo (criar em expo.dev se não tiver)
npx -y eas-cli@latest init         # vincula o projeto (grava o projectId no app.json)
npx -y eas-cli@latest build --platform android --profile production
```

Antes de buildar para valer, ajuste: `EXPO_PUBLIC_API_URL` do profile `production` em `eas.json` (hoje `https://seusite.com` — aponte para o backend real) e os Client IDs do Google (login social). O link do `.apk`/`.aab` sai no terminal e no dashboard `expo.dev`. Para Play Store: `eas submit --platform android` (precisa da conta de desenvolvedor Google + keystore — o EAS gerencia).

Lições do primeiro build real (19/09/2026, `production` → `.aab` OK em ~7 min):
- Sem git na máquina: `EAS_NO_VCS=1` (o EAS envia o diretório atual; sem isso o comando nem inicia).
- `file:../shared` **quebra o build remoto** (o upload contém só `frontend/mobile/`): tipos/client foram copiados para `mobile/src/shared/` com imports relativos (o Metro não resolve `@/` sem plugin). Manter o espelho sincronizado manualmente.
- Profile `production` gera `.aab` (Play Store); para instalar direto no aparelho, buildar com `"android": { "buildType": "apk" }` num profile `preview`.

## 10. Roadmap e checklist

Fase 1 (MVP): auth (inclui social), home, detalhes, player, checkout externo. Fase 2: downloads cripto, auto-play navegável, push via fila, busca com sugestões — **implementados**. Fase 3: tablet, Chromecast/AirPlay, perfis múltiplos (não iniciados).

- [x] Tipos compartilhados (copiados em `mobile/src/shared/`, espelho de `frontend/shared`) — sem contrato divergente
- [x] JWT + SecureStore, nunca cookie
- [x] Mesma URL assinada no player nativo
- [x] Home agregada (1 chamada) + seções por categoria
- [x] Downloads criptografados (AES userId+deviceId) + expiração + revalidação de acesso
- [ ] IAP avaliado antes do lançamento iOS
- [x] Disparo de push via BullMQ (fila `push` + worker + `PushToken`)
- [x] Login social (Google verificado via tokeninfo; Apple via JWKS)
- [x] `FlashList` nos carrosséis; velocidade persistida + landscape no player
- [x] Overlay "próxima aula" navega de verdade (`/api/mobile/lessons/[id]/next`)
- [x] Compartilhar certificado (Share API); sugestões na busca; instrutor + categoria no detalhe

## 11. Troubleshooting

| Sintoma | Causa provável |
|---|---|
| App não alcança a API no celular | `EXPO_PUBLIC_API_URL` com `localhost`; usar IP da máquina |
| 401 em tudo após login | `JWT_SECRET` diferente entre quem assinou e quem valida; token expirado (30d) |
| Tela preta no player | URL assinada expirada (4h) ou sem acesso (`hasAccess`); checar `playback-url` |
| Fontes caem p/ sistema | Google Fonts sem rede no boot; `fontFamily` só aplica após `useFonts` + splash |
| Push não chega | sem permissão; ver token em `push_tokens` e fila `push` no Bull Board |
| `tsc` do app falha | `npm install` em `frontend/mobile` primeiro; `crypto-es` v3 importa da raiz (`AES`, `SHA256`, `Utf8`) |
| Download falha com 404 | rendition estática não pronta — ativar Static Renditions no Mux |
