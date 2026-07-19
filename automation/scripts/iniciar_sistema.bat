@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================================
rem Inicializador central do rastreamento:
rem   - Docker Desktop
rem   - MySQL + Traccar + Event Gateway + Cloudflare Tunnel (Docker Compose)
rem   - API FastAPI + worker de fotos + tracker WhatsApp (um unico processo)
rem
rem Uso:
rem   iniciar_sistema.bat          Inicia e valida todo o sistema
rem   iniciar_sistema.bat --check  Valida configuracao sem iniciar servicos
rem
rem Variaveis opcionais:
rem   AUTOMATION_PYTHON             Caminho do python.exe a utilizar
rem   DOCKER_DESKTOP_EXE            Caminho do Docker Desktop.exe
rem   DOCKER_START_TIMEOUT_SECONDS  Prazo para o Docker iniciar (padrao: 180)
rem   COMPOSE_WAIT_TIMEOUT_SECONDS  Prazo do Compose --wait (padrao: 300)
rem   AUTOMATION_WAIT_SECONDS       Prazo da API integrada (padrao: 120)
rem ============================================================================

chcp 65001 >nul 2>&1

for %%I in ("%~dp0..") do set "AUTOMATION_DIR=%%~fI"
for %%I in ("!AUTOMATION_DIR!\..") do set "PROJECT_DIR=%%~fI"
set "TRACKING_DIR=!PROJECT_DIR!\tracking"
set "COMPOSE_FILE=!TRACKING_DIR!\compose.yaml"
set "MAIN_FILE=!AUTOMATION_DIR!\app\main.py"
set "LOG_DIR=!AUTOMATION_DIR!\logs"
set "SYSTEM_LOG=!LOG_DIR!\iniciar_sistema.log"
set "SERVICE_OUT_LOG=!LOG_DIR!\automation-service.out.log"
set "SERVICE_ERR_LOG=!LOG_DIR!\automation-service.err.log"
set "SERVICE_PID_FILE=!LOG_DIR!\automation-service.pid"
set "READY_STATE_FILE=!LOG_DIR!\health-ready.json"
set "RUNNING_SERVICES_FILE=!LOG_DIR!\compose-running-services.txt"

if not defined DOCKER_START_TIMEOUT_SECONDS set "DOCKER_START_TIMEOUT_SECONDS=180"
if not defined COMPOSE_WAIT_TIMEOUT_SECONDS set "COMPOSE_WAIT_TIMEOUT_SECONDS=300"
if not defined AUTOMATION_WAIT_SECONDS set "AUTOMATION_WAIT_SECONDS=120"

set "DOCKER_POLL_SECONDS=3"
set "HTTP_POLL_SECONDS=3"
set "AUTOMATION_STARTED_BY_SCRIPT=0"
set "FAIL_REASON=Falha nao especificada."

if not exist "!LOG_DIR!" mkdir "!LOG_DIR!" >nul 2>&1
if not exist "!LOG_DIR!" (
    echo ERRO: nao foi possivel criar "!LOG_DIR!".
    endlocal & exit /b 1
)

call :log "============================================================"
call :log "Inicializador central iniciado."
call :log "Projeto: !PROJECT_DIR!"

if not exist "!COMPOSE_FILE!" (
    set "FAIL_REASON=Compose nao encontrado: !COMPOSE_FILE!"
    goto :failed
)

if not exist "!MAIN_FILE!" (
    set "FAIL_REASON=Aplicacao FastAPI nao encontrada: !MAIN_FILE!"
    goto :failed
)

where docker >nul 2>&1
if errorlevel 1 (
    set "FAIL_REASON=O comando docker nao esta disponivel no PATH."
    goto :failed
)

docker compose version >>"!SYSTEM_LOG!" 2>&1
if errorlevel 1 (
    set "FAIL_REASON=Docker Compose v2 (docker compose) nao esta disponivel."
    goto :failed
)

call :resolve_python
if errorlevel 1 (
    set "FAIL_REASON=Python nao foi encontrado ou nao pode ser executado."
    goto :failed
)

call :validate_python_app
if errorlevel 1 (
    set "FAIL_REASON=A aplicacao Python ou alguma dependencia nao pode ser importada. Consulte !SYSTEM_LOG!."
    goto :failed
)

call :log "Validando a configuracao do Docker Compose."
docker compose --project-directory "!TRACKING_DIR!" -f "!COMPOSE_FILE!" config >nul 2>>"!SYSTEM_LOG!"
if errorlevel 1 (
    set "FAIL_REASON=A configuracao do Docker Compose e invalida. Consulte !SYSTEM_LOG!."
    goto :failed
)

if /I "%~1"=="--check" (
    call :log "CHECK OK: caminhos, Python e Docker Compose validados sem iniciar servicos."
    call :log "============================================================"
    endlocal & exit /b 0
)

if not "%~1"=="" (
    set "FAIL_REASON=Parametro desconhecido: %~1. Use --check ou execute sem parametros."
    goto :failed
)

call :ensure_docker
if errorlevel 1 (
    set "FAIL_REASON=O Docker nao ficou pronto em !DOCKER_START_TIMEOUT_SECONDS! segundos."
    goto :failed
)

call :start_compose
if errorlevel 1 (
    set "FAIL_REASON=Falha ao iniciar ou aguardar os servicos do Docker Compose. Consulte !SYSTEM_LOG!."
    goto :failed
)

call :capture_running_services
if errorlevel 1 (
    set "FAIL_REASON=Nao foi possivel consultar os servicos ativos do Docker Compose."
    goto :failed
)

call :require_running_service "mysql"
if errorlevel 1 (
    set "FAIL_REASON=O container mysql nao esta em execucao."
    goto :failed
)
call :require_running_service "traccar"
if errorlevel 1 (
    set "FAIL_REASON=O container traccar nao esta em execucao."
    goto :failed
)
call :require_running_service "event-gateway"
if errorlevel 1 (
    set "FAIL_REASON=O container event-gateway nao esta em execucao."
    goto :failed
)
call :require_running_service "cloudflared"
if errorlevel 1 (
    set "FAIL_REASON=O container cloudflared nao esta em execucao."
    goto :failed
)

call :wait_http "http://127.0.0.1:8082/api/health" 90 "Traccar"
if errorlevel 1 (
    set "FAIL_REASON=O Traccar nao respondeu com sucesso em http://127.0.0.1:8082/api/health."
    goto :failed
)

call :wait_http "http://127.0.0.1:3000/health" 60 "Event Gateway"
if errorlevel 1 (
    set "FAIL_REASON=O Event Gateway nao respondeu com sucesso em http://127.0.0.1:3000/health."
    goto :failed
)

call :probe_automation_ready
if not errorlevel 1 (
    call :log "API integrada ja estava pronta; inicializacao idempotente preservada."
    goto :automation_ready
)

call :port_is_free 8000
if errorlevel 1 (
    call :log "A porta 8000 esta ocupada; aguardando uma possivel inicializacao ja em andamento."
    call :wait_automation_ready 45
    if errorlevel 1 (
        call :describe_port_owner 8000
        set "FAIL_REASON=A porta 8000 esta ocupada, mas /health/ready nao ficou pronto. Nenhum processo alheio foi encerrado."
        goto :failed
    )
    call :log "API integrada existente ficou pronta."
    goto :automation_ready
)

call :start_automation
if errorlevel 1 (
    set "FAIL_REASON=Nao foi possivel iniciar a API integrada. Consulte !SERVICE_ERR_LOG!."
    goto :failed
)
set "AUTOMATION_STARTED_BY_SCRIPT=1"

call :wait_automation_ready !AUTOMATION_WAIT_SECONDS!
if errorlevel 1 (
    set "FAIL_REASON=A API integrada nao ficou pronta em !AUTOMATION_WAIT_SECONDS! segundos. Consulte !SERVICE_ERR_LOG!."
    goto :failed
)

:automation_ready
call :save_ready_state
if errorlevel 1 call :log "AVISO: sistema pronto, mas nao foi possivel gravar !READY_STATE_FILE!."

docker compose --project-directory "!TRACKING_DIR!" -f "!COMPOSE_FILE!" ps >>"!SYSTEM_LOG!" 2>&1
call :log "SUCESSO: Traccar, gateway, worker de fotos e tracker WhatsApp estao prontos."
call :log "Saude integrada: http://127.0.0.1:8000/health/ready"
call :log "PID da API: !SERVICE_PID_FILE!"
call :log "Logs da API: !SERVICE_OUT_LOG! e !SERVICE_ERR_LOG!"
call :log "============================================================"
endlocal & exit /b 0

:failed
if "!AUTOMATION_STARTED_BY_SCRIPT!"=="1" call :stop_started_automation
call :log "ERRO: !FAIL_REASON!"
call :log "O sistema NAO foi declarado pronto."
call :log "============================================================"
endlocal & exit /b 1

:resolve_python
if defined AUTOMATION_PYTHON (
    set "PYTHON_EXE=!AUTOMATION_PYTHON!"
) else if exist "!AUTOMATION_DIR!\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=!AUTOMATION_DIR!\.venv\Scripts\python.exe"
) else if exist "!PROJECT_DIR!\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=!PROJECT_DIR!\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

"!PYTHON_EXE!" --version >>"!SYSTEM_LOG!" 2>&1
if errorlevel 1 exit /b 1
call :log "Python selecionado: !PYTHON_EXE!"
exit /b 0

:validate_python_app
call :log "Validando imports da API, worker de fotos e tracker WhatsApp."
pushd "!AUTOMATION_DIR!" >nul 2>&1
if errorlevel 1 exit /b 1
"!PYTHON_EXE!" -c "import uvicorn; import app.main" >>"!SYSTEM_LOG!" 2>&1
set "PYTHON_IMPORT_RESULT=!errorlevel!"
popd >nul 2>&1
exit /b !PYTHON_IMPORT_RESULT!

:ensure_docker
docker info >nul 2>&1
if not errorlevel 1 (
    call :log "Docker ja esta pronto."
    exit /b 0
)

call :resolve_docker_desktop
if errorlevel 1 exit /b 1

call :log "Docker ainda nao esta pronto; iniciando Docker Desktop em segundo plano."
set "START_DOCKER_EXE=!DOCKER_DESKTOP_EXE!"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; Start-Process -FilePath $env:START_DOCKER_EXE -WindowStyle Hidden | Out-Null" >>"!SYSTEM_LOG!" 2>&1
if errorlevel 1 exit /b 1

set /a DOCKER_WAITED=0
:wait_docker_loop
docker info >nul 2>&1
if not errorlevel 1 (
    call :log "Docker ficou pronto apos !DOCKER_WAITED! segundos."
    exit /b 0
)
if !DOCKER_WAITED! GEQ !DOCKER_START_TIMEOUT_SECONDS! (
    docker info >>"!SYSTEM_LOG!" 2>&1
    exit /b 1
)
timeout.exe /t !DOCKER_POLL_SECONDS! /nobreak >nul 2>&1
set /a DOCKER_WAITED+=DOCKER_POLL_SECONDS
goto :wait_docker_loop

:resolve_docker_desktop
if defined DOCKER_DESKTOP_EXE (
    if exist "!DOCKER_DESKTOP_EXE!" exit /b 0
    call :log "DOCKER_DESKTOP_EXE aponta para um arquivo inexistente: !DOCKER_DESKTOP_EXE!"
    exit /b 1
)

if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    exit /b 0
)
if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
    set "DOCKER_DESKTOP_EXE=%LocalAppData%\Docker\Docker Desktop.exe"
    exit /b 0
)
call :log "Docker Desktop.exe nao foi encontrado nos caminhos conhecidos."
exit /b 1

:start_compose
call :log "Iniciando MySQL, Traccar, Event Gateway e Cloudflare Tunnel."
docker compose up --help 2>&1 | findstr.exe /C:"--wait-timeout" >nul
if not errorlevel 1 (
    docker compose --project-directory "!TRACKING_DIR!" -f "!COMPOSE_FILE!" up -d --wait --wait-timeout !COMPOSE_WAIT_TIMEOUT_SECONDS! >>"!SYSTEM_LOG!" 2>&1
    exit /b !errorlevel!
)

call :log "AVISO: esta versao do Compose nao oferece --wait-timeout; usando esperas de saude do inicializador."
docker compose --project-directory "!TRACKING_DIR!" -f "!COMPOSE_FILE!" up -d >>"!SYSTEM_LOG!" 2>&1
exit /b !errorlevel!

:capture_running_services
docker compose --project-directory "!TRACKING_DIR!" -f "!COMPOSE_FILE!" ps --status running --services >"!RUNNING_SERVICES_FILE!" 2>>"!SYSTEM_LOG!"
exit /b !errorlevel!

:require_running_service
for /f "usebackq delims=" %%S in ("!RUNNING_SERVICES_FILE!") do (
    if /I "%%S"=="%~1" exit /b 0
)
exit /b 1

:wait_http
setlocal EnableDelayedExpansion
set "HEALTH_URL=%~1"
set /a HEALTH_TIMEOUT=%~2
set "HEALTH_NAME=%~3"
set /a HEALTH_WAITED=0
call :log "Aguardando !HEALTH_NAME!: !HEALTH_URL!"
:wait_http_loop
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri $env:HEALTH_URL -TimeoutSec 5; if ([int]$r.StatusCode -ge 200 -and [int]$r.StatusCode -lt 300) { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
    call :log "!HEALTH_NAME! respondeu com sucesso apos !HEALTH_WAITED! segundos."
    endlocal & exit /b 0
)
if !HEALTH_WAITED! GEQ !HEALTH_TIMEOUT! (
    call :log "Tempo esgotado aguardando !HEALTH_NAME!."
    endlocal & exit /b 1
)
timeout.exe /t !HTTP_POLL_SECONDS! /nobreak >nul 2>&1
set /a HEALTH_WAITED+=HTTP_POLL_SECONDS
goto :wait_http_loop

:probe_automation_ready
set "HEALTH_URL=http://127.0.0.1:8000/health/ready"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference='SilentlyContinue'; try { $r=Invoke-RestMethod -Uri $env:HEALTH_URL -TimeoutSec 5; if ($r.status -eq 'ready') { exit 0 } } catch {}; exit 1" >nul 2>&1
exit /b !errorlevel!

:wait_automation_ready
setlocal EnableDelayedExpansion
set /a READY_TIMEOUT=%~1
set /a READY_WAITED=0
call :log "Aguardando API, worker de fotos e tracker WhatsApp em /health/ready."
:wait_automation_loop
call :probe_automation_ready
if not errorlevel 1 (
    call :log "API integrada ficou pronta apos !READY_WAITED! segundos."
    endlocal & exit /b 0
)
if !READY_WAITED! GEQ !READY_TIMEOUT! (
    call :log "Tempo esgotado aguardando /health/ready."
    endlocal & exit /b 1
)
timeout.exe /t !HTTP_POLL_SECONDS! /nobreak >nul 2>&1
set /a READY_WAITED+=HTTP_POLL_SECONDS
goto :wait_automation_loop

:port_is_free
set "CHECK_PORT=%~1"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$c=Get-NetTCPConnection -State Listen -LocalPort ([int]$env:CHECK_PORT) -ErrorAction SilentlyContinue; if ($c) { exit 1 }; exit 0" >nul 2>&1
exit /b !errorlevel!

:describe_port_owner
set "CHECK_PORT=%~1"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$items=Get-NetTCPConnection -State Listen -LocalPort ([int]$env:CHECK_PORT) -ErrorAction SilentlyContinue; foreach($item in $items) { $p=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $item.OwningProcess) -ErrorAction SilentlyContinue; Write-Output ('Porta ' + $env:CHECK_PORT + ': PID=' + $item.OwningProcess + '; processo=' + $p.Name) }" >>"!SYSTEM_LOG!" 2>&1
exit /b 0

:start_automation
call :log "Iniciando API FastAPI, worker de fotos e tracker WhatsApp em segundo plano."
set "START_PYTHON_EXE=!PYTHON_EXE!"
set "START_WORKING_DIR=!AUTOMATION_DIR!"
set "START_OUT_LOG=!SERVICE_OUT_LOG!"
set "START_ERR_LOG=!SERVICE_ERR_LOG!"
set "START_PID_FILE=!SERVICE_PID_FILE!"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; $arguments=@('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000'); $p=Start-Process -FilePath $env:START_PYTHON_EXE -ArgumentList $arguments -WorkingDirectory $env:START_WORKING_DIR -WindowStyle Hidden -RedirectStandardOutput $env:START_OUT_LOG -RedirectStandardError $env:START_ERR_LOG -PassThru; Start-Sleep -Milliseconds 750; if ($p.HasExited) { exit 1 }; [IO.File]::WriteAllText($env:START_PID_FILE, [string]$p.Id, [Text.Encoding]::ASCII)" >>"!SYSTEM_LOG!" 2>&1
exit /b !errorlevel!

:stop_started_automation
call :log "A API iniciada por esta tentativa nao ficou pronta; encerrando somente esse processo."
set "STOP_PID_FILE=!SERVICE_PID_FILE!"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='SilentlyContinue'; if (Test-Path -LiteralPath $env:STOP_PID_FILE) { try { $processId=[int](Get-Content -LiteralPath $env:STOP_PID_FILE -Raw) } catch { Write-Output ('AVISO: PID invalido em ' + $env:STOP_PID_FILE + '; nenhum processo foi encerrado.'); exit 0 }; $process=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $processId); if (-not $process) { Write-Output ('AVISO: PID ' + $processId + ' nao existe mais; nenhum processo foi encerrado.'); Remove-Item -LiteralPath $env:STOP_PID_FILE -Force; exit 0 }; $isPython=$process.Name -match '^(python|pythonw)(\.exe)?$'; $commandLine=[string]$process.CommandLine; $isExpected=($commandLine -match '(?i)(^|\s)-m\s+uvicorn(\s|$)') -and ($commandLine -match '(?i)(^|\s)\"?app\.main:app\"?(\s|$)') -and ($commandLine -match '(?i)(^|\s)--port(?:\s+|=)8000(\s|$)'); if (-not ($isPython -and $isExpected)) { Write-Output ('AVISO: PID ' + $processId + ' nao corresponde ao uvicorn app.main:app na porta 8000; processo preservado. Nome=' + $process.Name); exit 0 }; Stop-Process -Id $processId -Force; if ($?) { Remove-Item -LiteralPath $env:STOP_PID_FILE -Force; Write-Output ('Processo uvicorn validado e encerrado: PID ' + $processId) } else { Write-Output ('AVISO: nao foi possivel encerrar o processo uvicorn validado: PID ' + $processId) } }" >>"!SYSTEM_LOG!" 2>&1
set "AUTOMATION_STARTED_BY_SCRIPT=0"
exit /b 0

:save_ready_state
set "HEALTH_URL=http://127.0.0.1:8000/health/ready"
set "READY_OUTPUT_FILE=!READY_STATE_FILE!"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; $r=Invoke-RestMethod -Uri $env:HEALTH_URL -TimeoutSec 10; $json=$r | ConvertTo-Json -Depth 8; [IO.File]::WriteAllText($env:READY_OUTPUT_FILE, $json, (New-Object Text.UTF8Encoding($false)))" >>"!SYSTEM_LOG!" 2>&1
exit /b !errorlevel!

:log
set "LOG_MESSAGE=%~1"
echo([%date% %time:~0,8%] !LOG_MESSAGE!
>>"!SYSTEM_LOG!" echo([%date% %time:~0,8%] !LOG_MESSAGE!
exit /b 0
