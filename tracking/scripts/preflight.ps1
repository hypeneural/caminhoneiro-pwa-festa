$ErrorActionPreference = "Stop"

Write-Host "Preflight - Festa dos Caminhoneiros tracking"

docker --version
docker compose version

try {
  docker info | Out-Null
  Write-Host "[OK] Docker daemon respondeu"
} catch {
  Write-Host "[ERRO] Docker Desktop nao esta rodando ou daemon indisponivel"
  exit 1
}

Push-Location (Join-Path $PSScriptRoot "..")
try {
  docker compose config | Out-Null
  Write-Host "[OK] docker compose config"
} finally {
  Pop-Location
}

$checks = @(
  "http://localhost:8082/api/health",
  "http://localhost:3000/health"
)

foreach ($url in $checks) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
    Write-Host "[OK] $url -> $($response.StatusCode)"
  } catch {
    Write-Host "[AVISO] $url ainda nao respondeu"
  }
}

