# Deploy local em modo produção

Roda **tudo** na máquina como em produção (builds otimizados, `NODE_ENV=production`), mas com dados e chaves locais: Next.js (`:3000`), workers BullMQ, Postgres `:5433` + Redis `:6380` (Docker, volumes persistentes) e painel Vite (`:4173`). Mobile via LAN (§5).

## 1. Arquivos

| Arquivo | Papel |
|---|---|
| `infra/docker-compose.prod.yml` | Postgres 16 + Redis 7 (restart always, healthcheck, volumes `pgdata-prod`/`redisdata-prod`; portas fora do dev) |
| `.env.production.example` → `.env.production` | Todas as vars (nunca commitar; ver `.gitignore`) |
| `scripts/prod-install.ps1` | Checagens (node/npm/docker), `npm ci` root + web, `tsc` |
| `scripts/prod-up.ps1` | Pipeline: infra → health → `migrate deploy` → seed admin → builds → start (logs em `logs/`) |
| `scripts/prod-status.ps1` | Portas + HTTP + log dos workers |
| `scripts/prod-stop.ps1` | Para node (next/workers/painel) + `compose down` (volumes mantidos) |
| `scripts/mobile-lan.ps1` | Detecta IP da LAN, grava `frontend/mobile/.env`, abre o Expo |
| `scripts/seed-admin.ts` | Cria/promove ADMIN via `ADMIN_*` do ambiente (bcrypt 12) |

## 2. Subir do zero

```powershell
cp .env.production.example .env.production   # PowerShell: Copy-Item
# EDITE .env.production (senhas, DATABASE_URL/REDIS_URL, segredos)
.\scripts\prod-install.ps1                    # 1ª vez (ou -SkipInstall)
.\scripts\prod-up.ps1                         # pipeline completo
.\scripts\prod-status.ps1                     # checagem
```

## 3. Onde está cada coisa (validado em 19/09/2026)

| Serviço | URL | Check |
|---|---|---|
| Web Next (prod build, 27 rotas) | http://localhost:3000 | `/login` 200, `/admin` 307 sem login |
| Painel Vite (`dist/`) | http://localhost:4173 | 200 |
| Workers (email, certificate, video, push) | `logs/workers.log` | "Workers rodando..." |
| Postgres prod | `localhost:5433` | healthcheck `healthy`, 5 migrations |
| Redis prod | `localhost:6380` | healthcheck `healthy` |
| Mobile API | `:3000/api/mobile/*` | sem token → 401 |
| Admin seedado | `admin@local.test` | login 200, role `ADMIN` |

## 4. Operação

- **Ver saúde:** `.\scripts\prod-status.ps1`. **Parar:** `.\scripts\prod-stop.ps1` (mantém volumes; dados sobrevivem).
- **Re-deploy após mudar código:** `.\scripts\prod-up.ps1` (rebuilda) ou `-SkipBuild` (só restart).
- **Backup do volume:** `docker run --rm -v plataforma-prod_pgdata-prod:/data -v ${PWD}:/b postgres:16 pg_dump -U plataforma -h postgres > backup.sql` (compose rodando) — ou `docker volume` + cópia.
- **Reset total (apaga dados):** `docker compose -f infra/docker-compose.prod.yml down -v`.

## 5. Mobile no aparelho (mesmo Wi-Fi)

```powershell
.\scripts\mobile-lan.ps1   # grava EXPO_PUBLIC_API_URL=http://<seu-ip>:3000 e abre o Expo
```
Escaneie o QR no Expo Go. As chaves dummy do `.env.production` valem p/ navegação; pagamento/vídeo/email reais exigem credenciais de teste nos moldes de [DEPLOY-PRODUCAO.md](DEPLOY-PRODUCAO.md).

## 6. Limites deste modo (vs produção real)

Banco/Redis efêmeros na máquina (sem backup automático nem TLS); segredos em arquivo local; sem HTTPS (OAuth social e webhooks reais exigem URL pública); um único nó (sem réplicas). Para internet de verdade, seguir [DEPLOY-PRODUCAO.md](DEPLOY-PRODUCAO.md) (Vercel + Railway).

## 7. Falhas vistas na validação (resolvidas)

- Docker Desktop fechado → scripts falham no pipe; abrir o app (caminho certo: `%LocalAppData%\Programs\DockerDesktop\Docker Desktop.exe`).
- `prod-up.ps1` com `\"` final quebra o parser PowerShell (corrigido).
- Painel web não compilava: faltava `src/vite-env.d.ts` (`import.meta.env`) — criado; `tsc` + `vite build` OK.
