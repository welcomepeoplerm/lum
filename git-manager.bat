@echo off
chcp 65001 > nul
title LyfeUmbria Git Manager
color 0A

:menu
cls
echo.
echo ==========================================
echo     🚀 LYFEUMBRIA GIT MANAGER 🚀
echo ==========================================
echo.
echo  1. 📊 Git Status (verifica modifiche)
echo  2. ➕ Add & Commit (salva modifiche)
echo  3. 🔄 Pull (scarica aggiornamenti)
echo  4. ⬆️  Push (carica modifiche)
echo  5. 🔄 Pull + Push (sincronizza tutto)
echo  6. 📋 Git Log (cronologia)
echo  7. 🌿 Branch Info (rami git)
echo  8. 🏠 Add Remote Origin (connetti repository)
echo  9. ❌ Exit
echo.
echo ==========================================
set /p choice="Scegli un'opzione (1-9): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto commit
if "%choice%"=="3" goto pull
if "%choice%"=="4" goto push
if "%choice%"=="5" goto sync
if "%choice%"=="6" goto log
if "%choice%"=="7" goto branch
if "%choice%"=="8" goto remote
if "%choice%"=="9" goto exit
echo Opzione non valida!
pause
goto menu

:status
echo.
echo 📊 Controllo stato repository...
git status
echo.
pause
goto menu

:commit
echo.
echo ➕ Aggiunta e commit delle modifiche...
git add .
echo.
set /p message="💬 Inserisci messaggio commit (Enter per default): "
if "%message%"=="" set message=Update: modifiche al codice
git commit -m "%message%"
echo.
echo ✅ Commit completato!
pause
goto menu

:pull
echo.
echo 🔄 Download modifiche dal repository remoto...
git pull
echo.
if %errorlevel% equ 0 (
    echo ✅ Pull completato con successo!
) else (
    echo ❌ Errore durante il pull!
)
pause
goto menu

:push
echo.
echo ⬆️  Upload modifiche al repository remoto...
git push
echo.
if %errorlevel% equ 0 (
    echo ✅ Push completato con successo!
) else (
    echo ❌ Errore durante il push! Controlla se hai un remote configurato.
)
pause
goto menu

:sync
echo.
echo 🔄 Sincronizzazione completa (Pull + Add + Commit + Push)...
echo.
echo 1/4 - Pull delle modifiche remote...
git pull
echo.
echo 2/4 - Aggiunta file modificati...
git add .
echo.
set /p message="💬 Messaggio commit (Enter per default): "
if "%message%"=="" set message=Sync: aggiornamento automatico
echo 3/4 - Commit delle modifiche...
git commit -m "%message%"
echo.
echo 4/4 - Push al repository remoto...
git push
echo.
echo ✅ Sincronizzazione completata!
pause
goto menu

:log
echo.
echo 📋 Ultimi 10 commit:
git log --oneline -10 --graph --decorate
echo.
pause
goto menu

:branch
echo.
echo 🌿 Informazioni sui branch:
echo.
echo Branch attuale:
git branch
echo.
echo Branch remoti:
git branch -r
echo.
pause
goto menu

:remote
echo.
echo 🏠 Configurazione Remote Origin
echo.
echo Remote attuali:
git remote -v
echo.
set /p remote_url="🔗 Inserisci URL del repository remoto (es: https://github.com/user/repo.git): "
if not "%remote_url%"=="" (
    git remote add origin "%remote_url%"
    echo ✅ Remote origin aggiunto!
    echo.
    echo Per il primo push usa:
    echo git push -u origin master
) else (
    echo ❌ URL non inserito!
)
echo.
pause
goto menu

:exit
echo.
echo 👋 Arrivederci!
timeout /t 2 > nul
exit

:error
echo.
echo ❌ Si è verificato un errore!
pause
goto menu