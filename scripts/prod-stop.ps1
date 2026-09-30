#Requires -Version 5.1
<#
.SYNOPSIS
  Para tudo do deploy local: serviços node + compose prod.
#>
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
  $_.CommandLine -match "next-server|next[\\/]dist\\bin\\next|tsx.*workers|vite preview"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host "parado: $($_.ProcessId)" }
docker compose -f infra/docker-compose.prod.yml --env-file .env.production down 2>$null
Write-Host "PROD-STOP OK"
