#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe o ambiente local em modo produção: infra -> migrate -> seed -> build -> start.
.EXAMPLE
  .\scripts\prod-up.ps1            # pipeline completo
  .\scripts\prod-up.ps1 -SkipBuild # sem rebuild (usa .next/dist existentes)
#>
param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
New-Item -ItemType Directory -Path "$Root\logs" -Force | Out-Null

if (-not (Test-Path "$Root\.env.production")) { throw "Falta .env.production (copie de .env.production.example e preencha)" }
Get-Content "$Root\.env.production" | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -notmatch "=") { return }
  $k, $v = $_.Split("=", 2); Set-Item "env:$($k.Trim())" $v.Trim()
}
foreach ($v in @("DATABASE_URL", "REDIS_URL")) {
  if (-not (Get-Item "env:$v" -ErrorAction SilentlyContinue).Value) { throw "Defina $v no .env.production" }
}

Write-Host "== [1/6] infra (postgres :5433 + redis :6380) =="
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d
Write-Host "== [2/6] aguardando saúde do banco/redis =="
for ($i = 0; $i -lt 30; $i++) {
  $pg = docker inspect --format "{{.State.Health.Status}}" plataforma-prod-postgres-1 2>$null
  $rd = docker inspect --format "{{.State.Health.Status}}" plataforma-prod-redis-1 2>$null
  if ($pg -eq "healthy" -and $rd -eq "healthy") { break }
  Start-Sleep -Seconds 4
}
Write-Host "postgres=$pg redis=$rd"

Write-Host "== [3/6] migrations =="
npx prisma migrate deploy

if ($env:ADMIN_EMAIL -and $env:ADMIN_PASSWORD) {
  Write-Host "== [4/6] seed admin =="
  npx tsx scripts/seed-admin.ts
} else { Write-Host "== [4/6] seed pulado (sem ADMIN_* no .env.production) ==" }

if (-not $SkipBuild) {
  Write-Host "== [5/6] build backend + painel web =="
  npm run build
  Push-Location "$Root\frontend\web"
  if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
  npm run build
  Pop-Location
} else { Write-Host "== [5/6] build pulado (-SkipBuild) ==" }

Write-Host "== [6/6] subindo serviços =="
$env:NODE_ENV = "production"
Start-Process -FilePath "cmd" -ArgumentList "/c npx next start -p $env:PORT > logs\web.log 2>&1" -WorkingDirectory $Root -WindowStyle Hidden | Out-Null
Start-Process -FilePath "cmd" -ArgumentList "/c npx tsx workers/index.ts > logs\workers.log 2>&1" -WorkingDirectory $Root -WindowStyle Hidden | Out-Null
Push-Location "$Root\frontend\web"
Start-Process -FilePath "cmd" -ArgumentList "/c npx vite preview --port 4173 --strictPort > ..\..\logs\painel.log 2>&1" -WorkingDirectory "$Root\frontend\web" -WindowStyle Hidden | Out-Null
Pop-Location
Start-Sleep -Seconds 12
& "$Root\scripts\prod-status.ps1"
Write-Host 'PROD-UP OK - logs em ./logs/'
