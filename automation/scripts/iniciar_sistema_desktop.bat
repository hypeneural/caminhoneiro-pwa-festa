@echo off
setlocal EnableExtensions

set "ORCHESTRATOR=C:\Users\Usuario\Documents\New project 4\caminhoneiro-pwa-festa\automation\scripts\iniciar_sistema.bat"

if not exist "%ORCHESTRATOR%" (
    echo ERRO: inicializador central nao encontrado:
    echo %ORCHESTRATOR%
    endlocal ^& exit /b 1
)

call "%ORCHESTRATOR%" %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
