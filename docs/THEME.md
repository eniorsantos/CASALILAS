# Base do tema — todos os frontends

Fonte visual única: `mockup-telas-app.html` (fundo roxo-escuro, acento roxo, Bebas Neue + Inter). Cada plataforma espelha os mesmos valores no seu formato:

| Plataforma | Onde vive | Formato |
|---|---|---|
| Canônico (TS) | `frontend/shared/src/theme.ts` | `themeColors`, `themeTypography`, `tileGradients` |
| Next.js (aluno + admin) | `app/globals.css` (`.theme-streaming` e `:root`) + `tailwind.config.ts` | CSS vars + classes `st-*` / admin |
| Painel Vite | `frontend/web/src/index.css` + `tailwind.config.js` + fontes no `index.html` | CSS vars + classes `st-*` |
| Mobile | `frontend/mobile/src/theme/tokens.ts` (+ espelho em `src/shared/theme.ts`) | `colors`, `typography` |

## Paleta (idêntica nos 4 lugares)

`bg #1E1830` · `surface #2A2340` · `surface2 #352C4D` · `surface3/border #453A5C` · `accent #9B5DE5` · `accent-warm #D9B8FF` · `text #F5F3F8` · `dim #B3A9C2` · `success #46D369`.

Exceção: o admin Next.js claro (`.light`) usa a paleta warm original (`#FAFAF9/#6D4FC7`) — opt-in pelo toggle da topbar.

## Tipografia

Display `Bebas Neue` (títulos/hero/marca), corpo `Inter`. Next.js via `next/font` (vars `--font-display/--font-inter`); Vite e mobile via Google Fonts (`index.html` / `expo-google-fonts` + SplashScreen).

## Utilitários compartilhados

`no-scrollbar` (carrosséis), tiles 92–180px com gradientes `g1..g6` e barra de progresso de 3px no acento, badge `EM ALTA` (`accent-warm` sobre `#2A2033`), botões primário claro / secundário translúcido / CTA cheio no acento.

## Regra de sincronia

Mudou um token? Atualize **nessa ordem**: `frontend/shared/src/theme.ts` → copie para `frontend/mobile/src/shared/theme.ts` → `globals.css`/`index.css` + configs Tailwind. O `tsc` dos três pacotes + `vite build` validam (mobile: Metro não resolve `@/` — usar imports relativos).
