@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo   LYFE - Stop servizi piattaforma
echo ==============================================
echo.

echo [STOP] Chiusura finestre servizi avviate da start-all...
taskkill /F /FI "WINDOWTITLE eq LYFE_WEB_3001*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq LYFE_EMULATORS_5000_5001_5002*" /T >nul 2>&1

echo [STOP] Verifica e rilascio porte (3001, 5000, 5001, 5002)...
call :KillPort 3001
call :KillPort 5000
call :KillPort 5001
call :KillPort 5002

echo.
echo [OK] Tentativo di arresto completato.
endlocal
goto :eof

:KillPort
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%1 .*LISTENING"') do (
  echo   - Kill PID %%P su porta %1
  taskkill /F /PID %%P >nul 2>&1
)
exit /b
