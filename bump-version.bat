@echo off
REM bump-version.bat - incrementa la versione e crea commit + tag
REM Usage: doppio click o esegui da PowerShell/CMD in cartella progetto












necho Versione aggiornata a %NEW_VER% && pause
:: Commit e tag
ngit add version.json package.json
ngit commit -m "Bump version to %NEW_VER%"
ngit tag v%NEW_VER%
ngit push
ngit push --tagsfor /f "usebackq tokens=*" %%v in (`powershell -NoProfile -Command "(Get-Content -Raw version.json | ConvertFrom-Json).version"`) do set NEW_VER=%%v
:: Leggi nuova versione da version.json (PowerShell inline))  exit /b %ERRORLEVEL%  echo Errore durante l'incremento della versioneIF %ERRORLEVEL% NEQ 0 (node increment-version.js:: Esegui increment script (aggiorna version.json e package.json)