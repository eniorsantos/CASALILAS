#Requires -Version 5.1
<#
.SYNOPSIS
  Aponta o app mobile para o backend da sua máquina (LAN) e abre o Expo.
  Uso: .\scripts\mobile-lan.ps1   (celular e PC no mesmo Wi-Fi)
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^(127\.|169\.254\.)" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
if (-not $ip) { throw "IP de LAN não encontrado" }
$envFile = "$Root\frontend\mobile\.env"
"EXPO_PUBLIC_API_URL=http://$($ip):3000" | Set-Content $envFile
Write-Host "Mobile apontado para http://$($ip):3000 (gravado em frontend/mobile/.env)"
Set-Location "$Root\frontend\mobile"
npx expo start
