@echo off
title Tracker Festa do Caminhoneiro - Auto Restart
echo =================================================================
echo   Servico de Rastreamento Veicular - WhatsApp Z-API
echo   Iniciando servidor local e monitoramento em background...
echo =================================================================
:start
echo [%date% %time%] Iniciando uvicorn...
python -m uvicorn app.main:app --port 8080 --host 127.0.0.1
echo [%date% %time%] Servidor parou ou caiu. Reiniciando em 5 segundos...
timeout /t 5 >nul
goto start
