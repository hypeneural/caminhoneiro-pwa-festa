param(
  [string]$DeviceId = "SC26-CAM-001-K8P2",
  [double]$Lat = -27.236099,
  [double]$Lon = -48.644599
)

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$uri = "http://localhost:5055/?id=$DeviceId&lat=$Lat&lon=$Lon&timestamp=$timestamp"

Write-Host "Enviando posicao fake para Traccar:"
Write-Host $uri

try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 10
  Write-Host "[OK] Traccar recebeu a posicao: $($response.StatusCode)"
  if ($response.Content) {
    Write-Host $response.Content
  }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "[ERRO] Falha ao enviar posicao. HTTP $status"
  exit 1
}
