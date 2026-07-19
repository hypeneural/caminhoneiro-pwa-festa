$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backupDir = Join-Path $root "data/backups"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$archive = Join-Path $backupDir "tracking_backup_$stamp.tar.gz"

Push-Location $root
try {
  tar -czf $archive data/gateway traccar/logs
  Write-Host "Backup criado: $archive"
} finally {
  Pop-Location
}

