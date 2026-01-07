# 🚀 LyfeUmbria Git PowerShell Manager
# Versione PowerShell avanzata per operazioni Git

param(
    [string]$Action,
    [string]$Message
)

# Configurazione
$RepoName = "LyfeUmbria"
$DefaultCommitMessage = "Update: modifiche al progetto LyfeUmbria"

# Funzioni utility
function Write-Header {
    param([string]$Title)
    Clear-Host
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "    🚀 $Title 🚀" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# Funzione per verificare se siamo in un repo git
function Test-GitRepo {
    if (!(Test-Path .git)) {
        Write-Error "Non sei in una directory git!"
        Write-Host "Esegui 'git init' per inizializzare un repository."
        exit 1
    }
}

# Funzione per ottenere lo status git
function Get-GitStatus {
    Write-Header "GIT STATUS - $RepoName"
    Test-GitRepo
    
    Write-Info "Stato attuale del repository:"
    git status --porcelain | ForEach-Object {
        $status = $_.Substring(0,2)
        $file = $_.Substring(3)
        
        switch ($status.Trim()) {
            "M"  { Write-Host "📝 Modified:  $file" -ForegroundColor Yellow }
            "A"  { Write-Host "➕ Added:     $file" -ForegroundColor Green }
            "D"  { Write-Host "🗑️  Deleted:   $file" -ForegroundColor Red }
            "??" { Write-Host "❓ Untracked: $file" -ForegroundColor Gray }
            "R"  { Write-Host "📁 Renamed:   $file" -ForegroundColor Blue }
            default { Write-Host "$status $file" }
        }
    }
    
    $changes = git status --porcelain
    if (!$changes) {
        Write-Success "Repository pulito - nessuna modifica"
    }
    
    Write-Host ""
    Write-Info "Branch corrente:"
    git branch --show-current | ForEach-Object { Write-Host "🌿 $_" -ForegroundColor Green }
}

# Funzione per commit
function Invoke-GitCommit {
    param([string]$CommitMessage = $DefaultCommitMessage)
    
    Write-Header "GIT COMMIT - $RepoName"
    Test-GitRepo
    
    # Verifica se ci sono modifiche
    $changes = git status --porcelain
    if (!$changes) {
        Write-Info "Nessuna modifica da committare"
        return
    }
    
    Write-Info "Aggiunta di tutti i file modificati..."
    git add .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "File aggiunti al tracking"
        
        Write-Info "Creazione commit con messaggio: '$CommitMessage'"
        git commit -m $CommitMessage
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Commit creato con successo!"
            
            # Mostra l'ultimo commit
            Write-Host ""
            Write-Info "Ultimo commit:"
            git log -1 --oneline --decorate
        } else {
            Write-Error "Errore durante il commit"
        }
    } else {
        Write-Error "Errore durante l'aggiunta dei file"
    }
}

# Funzione per pull
function Invoke-GitPull {
    Write-Header "GIT PULL - $RepoName"
    Test-GitRepo
    
    Write-Info "Download modifiche dal repository remoto..."
    git pull
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pull completato con successo!"
    } else {
        Write-Error "Errore durante il pull. Controlla la connessione e il remote."
    }
}

# Funzione per push
function Invoke-GitPush {
    Write-Header "GIT PUSH - $RepoName"
    Test-GitRepo
    
    Write-Info "Upload modifiche al repository remoto..."
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Push completato con successo!"
    } else {
        Write-Error "Errore durante il push. Potrebbe essere necessario configurare il remote."
        Write-Host ""
        Write-Info "Per configurare il remote:"
        Write-Host "git remote add origin https://github.com/username/repository.git"
        Write-Host "git push -u origin master"
    }
}

# Funzione per sync completa
function Invoke-GitSync {
    param([string]$CommitMessage = $DefaultCommitMessage)
    
    Write-Header "GIT SYNC COMPLETA - $RepoName"
    
    Write-Info "1/4 - Pull delle modifiche remote..."
    Invoke-GitPull
    
    Write-Host ""
    Write-Info "2/4 - Verifica modifiche locali..."
    $changes = git status --porcelain
    if ($changes) {
        Write-Info "3/4 - Commit delle modifiche locali..."
        Invoke-GitCommit -CommitMessage $CommitMessage
        
        Write-Host ""
        Write-Info "4/4 - Push al repository remoto..."
        Invoke-GitPush
    } else {
        Write-Info "Nessuna modifica locale da sincronizzare"
        Write-Success "Sincronizzazione completata!"
    }
}

# Funzione per visualizzare il log
function Show-GitLog {
    Write-Header "GIT LOG - $RepoName"
    Test-GitRepo
    
    Write-Info "Ultimi 10 commit:"
    git log --oneline -10 --graph --decorate --color=always
}

# Menu interattivo
function Show-Menu {
    do {
        Write-Header "MENU PRINCIPALE - $RepoName"
        
        Write-Host "1. 📊 Git Status" -ForegroundColor White
        Write-Host "2. ➕ Commit modifiche" -ForegroundColor White
        Write-Host "3. 🔄 Pull (scarica)" -ForegroundColor White
        Write-Host "4. ⬆️  Push (carica)" -ForegroundColor White
        Write-Host "5. 🔄 Sync completa" -ForegroundColor White
        Write-Host "6. 📋 Git Log" -ForegroundColor White
        Write-Host "7. 🌿 Info Branch" -ForegroundColor White
        Write-Host "8. 🔧 Configurazione" -ForegroundColor White
        Write-Host "9. ❌ Esci" -ForegroundColor White
        Write-Host ""
        
        $choice = Read-Host "Scegli un'opzione (1-9)"
        
        switch ($choice) {
            "1" { 
                Get-GitStatus
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "2" { 
                $msg = Read-Host "Messaggio commit (Enter per default)"
                if ([string]::IsNullOrWhiteSpace($msg)) { $msg = $DefaultCommitMessage }
                Invoke-GitCommit -CommitMessage $msg
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "3" { 
                Invoke-GitPull
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "4" { 
                Invoke-GitPush
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "5" { 
                $msg = Read-Host "Messaggio commit per sync (Enter per default)"
                if ([string]::IsNullOrWhiteSpace($msg)) { $msg = $DefaultCommitMessage }
                Invoke-GitSync -CommitMessage $msg
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "6" { 
                Show-GitLog
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "7" { 
                Write-Header "BRANCH INFO - $RepoName"
                Write-Info "Branch corrente:"
                git branch
                Write-Host ""
                Write-Info "Branch remoti:"
                git branch -r
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "8" { 
                Write-Header "CONFIGURAZIONE - $RepoName"
                Write-Info "Remote configurati:"
                git remote -v
                Write-Host ""
                $addRemote = Read-Host "Vuoi aggiungere un remote origin? (y/n)"
                if ($addRemote -eq "y") {
                    $remoteUrl = Read-Host "URL del repository remoto"
                    if (![string]::IsNullOrWhiteSpace($remoteUrl)) {
                        git remote add origin $remoteUrl
                        Write-Success "Remote origin aggiunto!"
                    }
                }
                Write-Host ""
                Read-Host "Premi Enter per continuare"
            }
            "9" { 
                Write-Success "Arrivederci!"
                return
            }
            default { 
                Write-Error "Opzione non valida!"
                Start-Sleep -Seconds 1
            }
        }
    } while ($true)
}

# Main execution
if ($Action) {
    # Esecuzione con parametri
    switch ($Action.ToLower()) {
        "status" { Get-GitStatus }
        "commit" { Invoke-GitCommit -CommitMessage $Message }
        "pull" { Invoke-GitPull }
        "push" { Invoke-GitPush }
        "sync" { Invoke-GitSync -CommitMessage $Message }
        "log" { Show-GitLog }
        default { 
            Write-Error "Azione non riconosciuta: $Action"
            Write-Info "Azioni disponibili: status, commit, pull, push, sync, log"
        }
    }
} else {
    # Menu interattivo
    Show-Menu
}