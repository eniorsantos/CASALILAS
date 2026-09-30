#Requires -Version 5.1
<#
.SYNOPSIS
  Instala dependências e valida o ambiente p/ deploy local em produção.
.EXAMPLE
  .\scripts\prod-install.ps1            # completo (npm ci em root + web)
  .\scripts\prod-install.ps1 -SkipInstall  # só checagens (node_modules já ok)
#>
param([switch]$SkipInstall)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Check($Name, $Cmd) {
  try { & @Cmd 2>$null | Out-Null; Write-Host "[OK] $Name" }
  catch { Write-Host "[FALTA] $Name"; throw "$Name não encontrado no PATH" }
}

Write-Host "== prod-install: checagens =="
Check "Node 20+" "node" @("--version")
Check "npm" "npm" @("--version")
Check "Docker" "docker" @("--version")
if (-not (Test-Path "$Root\.env.production")) {
  Copy-Item "$Root\.env.production.example" "$Root\.env.production"
  Write-Host "[INFO] .env.production criado do exemplo — PREENCHA antes do up"
} else { Write-Host "[OK] .env.production existe" }

if (-not $SkipInstall) {
  Write-Host "== instalando backend (npm ci) =="
  npm ci --no-audit --no-fund
  Write-Host "== instalando painel web (frontend/web) =="
  Push-Location "$Root\frontend\web"
  npm ci --no-audit --no-fund
  Pop-Location
} else { Write-Host "[INFO] install pulado (-SkipInstall)" }

Write-Host "== type-check backend =="
npx tsc --noEmit
Write-Host "PROD-INSTALL OK"
