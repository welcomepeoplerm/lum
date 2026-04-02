@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==============================================
echo   LYFE - Avvio servizi piattaforma
echo ==============================================
echo.

if not exist "node_modules" (
  echo [INFO] Dipendenze root non trovate. Avvio npm install...
  call npm install
)

if not exist "functions\node_modules" (
  echo [INFO] Dipendenze functions non trovate. Avvio npm install --prefix functions...
  call npm install --prefix functions
)

echo [START] Next.js (porta 3001)...
start "LYFE_WEB_3001" cmd /k "cd /d "%~dp0" && npm run dev"

echo [START] Firebase Emulators (hosting/functions/ui)...
start "LYFE_EMULATORS_5000_5001_5002" cmd /k "cd /d "%~dp0" && npx firebase emulators:start"

echo.
echo [OK] Servizi avviati in finestre separate.
echo - Web:        http://localhost:3001
echo - Emulator UI: http://localhost:5002
echo.
endlocal
