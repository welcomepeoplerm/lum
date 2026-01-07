@echo off
chcp 65001 > nul
title Git Manager Semplice - LyfeUmbria
color 0A

:menu
cls
echo.
echo ========================================
echo     🚀 GIT MANAGER SEMPLICE 🚀
echo     Repository: welcomepeoplerm/lum
echo ========================================
echo.
echo  1. 📊 Stato (git status)
echo  2. 💾 Commit (salva modifiche)
echo  3. ⬇️  Pull (scarica)
echo  4. ⬆️  Push (carica)
echo  5. 🔄 Sync (pull + commit + push)
echo  6. ❌ Esci
echo.
echo ========================================
set /p scelta="Scegli (1-6): "

if "%scelta%"=="1" goto stato
if "%scelta%"=="2" goto commit
if "%scelta%"=="3" goto pull
if "%scelta%"=="4" goto push
if "%scelta%"=="5" goto sync
if "%scelta%"=="6" goto esci

echo Scelta non valida!
pause
goto menu

:stato
echo.
echo 📊 Stato del repository:
echo.
git status
echo.
echo Premi un tasto per continuare...
pause >nul
goto menu

:commit
echo.
echo 💾 Commit delle modifiche...
echo.
git add .
echo File aggiunti al commit.
echo.
set /p messaggio="Inserisci messaggio (Enter per default): "
if "%messaggio%"=="" set messaggio=Aggiornamento codice
echo.
git commit -m "%messaggio%"
echo.
if %errorlevel%==0 (
    echo ✅ Commit completato!
) else (
    echo ❌ Errore nel commit o nessuna modifica da committare.
)
echo.
pause
goto menu

:pull
echo.
echo ⬇️ Download dal repository remoto...
echo.
git pull origin main
echo.
if %errorlevel%==0 (
    echo ✅ Pull completato!
) else (
    echo ❌ Errore durante il pull.
)
echo.
pause
goto menu

:push
echo.
echo ⬆️ Upload al repository remoto...
echo.
git push origin main
echo.
if %errorlevel%==0 (
    echo ✅ Push completato!
) else (
    echo ❌ Errore durante il push.
)
echo.
pause
goto menu

:sync
echo.
echo 🔄 Sincronizzazione completa...
echo.

echo [1/3] Pull...
git pull origin main
if %errorlevel% neq 0 (
    echo ❌ Errore nel pull, interrompo.
    pause
    goto menu
)

echo [2/3] Commit...
git add .
set /p msg="Messaggio per il commit: "
if "%msg%"=="" set msg=Sync automatico
git commit -m "%msg%"

echo [3/3] Push...
git push origin main
if %errorlevel%==0 (
    echo ✅ Sincronizzazione completata!
) else (
    echo ❌ Errore durante il push.
)
echo.
pause
goto menu

:esci
echo.
echo 👋 Ciao!
timeout /t 1 >nul
exit