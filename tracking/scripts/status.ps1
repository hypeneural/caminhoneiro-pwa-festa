$ErrorActionPreference = "Stop"

Write-Host "Status - Festa dos Caminhoneiros tracking"

try {
  docker info | Out-Null
} catch {
  Write-Host "[ERRO] Docker Desktop nao esta rodando ou daemon indisponivel"
  exit 1
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  docker compose ps
  Write-Host ""
  Write-Host "Ultimas linhas do Event Gateway:"
  docker compose logs --tail 50 event-gateway
} finally {
  Pop-Location
}

