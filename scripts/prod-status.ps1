#Requires -Version 5.1
<#
.SYNOPSIS
  Healthcheck do deploy local: portas, HTTP e filas.
#>
$ErrorActionPreference = "Continue"
function Probe($Name, $Url, $Expect = 0) {
  try { $r = Invoke-WebRequest -Uri $Url -MaximumRedirection 0 -TimeoutSec 15 -UseBasicParsing; Write-Host "[UP] $Name => $($r.StatusCode) $Url" }
  catch {
    $sc = $_.Exception.Response.StatusCode.value__
    if ($Expect -ne 0 -and $sc -eq $Expect) { Write-Host "[UP] $Name => $sc (esperado) $Url" }
    else { Write-Host "[DOWN/REDIR] $Name => $sc $Url" }
  }
}
function Port($Name, $P) {
  $l = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $P } | Select-Object -First 1
  if ($l) { Write-Host "[UP] $Name :$P" } else { Write-Host "[DOWN] $Name :$P" }
}
Write-Host "== portas =="
Port "postgres-prod" 5433; Port "redis-prod" 6380; Port "web-next" 3000; Port "painel-vite" 4173
Write-Host "== http =="
Probe "next-login" "http://localhost:3000/login"
Probe "next-admin-guard" "http://localhost:3000/admin" 307
Probe "painel-web" "http://localhost:4173/"
Probe "api-mobile-guard" "http://localhost:3000/api/mobile/home" 401
Write-Host "== workers (log) =="
Select-String -Path ".\logs\workers.log" -Pattern "Workers rodando|error|Error" -ErrorAction SilentlyContinue | Select-Object -Last 3
