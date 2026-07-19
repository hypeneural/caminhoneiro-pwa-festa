$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $root ".env"

if (!(Test-Path -LiteralPath $envPath)) {
  Write-Host "[ERRO] Arquivo .env nao encontrado em $envPath"
  exit 1
}

$envValues = @{}
Get-Content -LiteralPath $envPath | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -notmatch "=") {
    return
  }

  $parts = $_ -split "=", 2
  $envValues[$parts[0].Trim()] = $parts[1].Trim()
}

$email = $envValues["TRACCAR_EMAIL"]
$password = $envValues["TRACCAR_PASSWORD"]

if (!$email -or !$password) {
  Write-Host "[ERRO] TRACCAR_EMAIL/TRACCAR_PASSWORD ausentes no .env"
  exit 1
}

$body = @{
  name = "Admin Festa"
  email = $email
  password = $password
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8082/api/users" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 20
  Write-Host "[OK] Usuario admin criado: $($response.StatusCode)"
  Write-Host $response.Content
} catch {
  $status = $_.Exception.Response.StatusCode.value__

  if ($status -eq 400 -or $status -eq 401) {
    Write-Host "[AVISO] Nao foi possivel criar usuario. Ele pode ja existir ou registro pode estar fechado. HTTP $status"
    exit 0
  }

  throw
}

