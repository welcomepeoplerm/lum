# 🚀 Git Quick Commands - LyfeUmbria Manager

Questo progetto include due script per semplificare le operazioni Git:

## 📁 File Creati

### 1. `git-manager.bat` (Windows Batch)
Script semplice e universale che funziona su tutti i sistemi Windows.

**Come usare:**
```bash
# Esegui il file direttamente
./git-manager.bat

# Oppure doppio click dal file explorer
```

### 2. `git-manager.ps1` (PowerShell Avanzato)
Script PowerShell con funzionalità avanzate e interfaccia colorata.

**Come usare:**
```powershell
# Menu interattivo
.\git-manager.ps1

# Comandi diretti
.\git-manager.ps1 -Action status
.\git-manager.ps1 -Action commit -Message "Il mio commit"
.\git-manager.ps1 -Action pull
.\git-manager.ps1 -Action push
.\git-manager.ps1 -Action sync -Message "Sincronizzazione automatica"
```

## 🔧 Funzionalità Principali

### ✅ Operazioni Base
- **Status**: Visualizza lo stato del repository
- **Add & Commit**: Aggiunge e committa le modifiche
- **Pull**: Scarica aggiornamenti dal repository remoto
- **Push**: Carica modifiche al repository remoto
- **Sync**: Sincronizzazione completa (pull + commit + push)

### 🔍 Informazioni
- **Git Log**: Visualizza cronologia commit
- **Branch Info**: Informazioni sui branch
- **Remote Configuration**: Configura repository remoti

## 🚀 Setup Iniziale Repository Remoto

Se non hai ancora configurato un repository remoto:

### 1. Crea repository su GitHub/GitLab/Bitbucket
- Vai su GitHub.com
- Clicca "New Repository"
- Nome: `lyfeumbria-manager`
- Crea il repository

### 2. Connetti il repository locale
```bash
# Opzione 1: Usa il script
./git-manager.bat
# Scegli opzione 8 per configurare remote

# Opzione 2: Comando manuale
git remote add origin https://github.com/welcomepeoplerm/lum.git
git push -u origin master
```

## 💡 Workflow Consigliato

### 🔄 Lavoro Quotidiano
1. **Pull** all'inizio della giornata per scaricare eventuali modifiche
2. Lavora sul codice normalmente
3. **Status** per vedere le modifiche
4. **Commit** per salvare le modifiche con un messaggio descrittivo
5. **Push** per caricare le modifiche sul repository remoto

### 🚀 Sync Rapida
Usa l'opzione **Sync** per fare tutto in una volta:
- Pull delle modifiche remote
- Commit delle modifiche locali
- Push al repository remoto

## 📋 Esempi d'Uso

### Scenario 1: Prima volta
```bash
# 1. Esegui lo script
./git-manager.bat

# 2. Scegli opzione 8 (Add Remote Origin)
# 3. Inserisci: https://github.com/username/lyfeumbria-manager.git

# 4. Scegli opzione 4 (Push) per il primo upload
```

### Scenario 2: Sviluppo quotidiano
```bash
# 1. Inizio giornata
./git-manager.bat → opzione 3 (Pull)

# 2. Dopo aver lavorato sul codice
./git-manager.bat → opzione 2 (Commit)
# Messaggio: "Aggiunta gestione documenti Google Drive"

# 3. Upload delle modifiche
./git-manager.bat → opzione 4 (Push)
```

### Scenario 3: Sync automatica
```bash
./git-manager.bat → opzione 5 (Sync completa)
# Fa tutto automaticamente!
```

## 🔒 File Ignorati

Il file `.gitignore` è già configurato per ignorare:
- `.env.local` (credenziali sensibili)
- `node_modules/` (dipendenze)
- `.next/` (build cache)
- File di log e temporanei

## ⚠️ Avvisi di Sicurezza

- ✅ Il file `.env.local` è ignorato da git (non verrà caricato)
- ✅ Le credenziali Firebase sono al sicuro
- ✅ Le chiavi API non vengono condivise

## 🆘 Risoluzione Problemi

### Errore "Permission Denied"
```bash
# Su PowerShell, esegui:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Errore "Not a git repository"
```bash
# Assicurati di essere nella directory del progetto
cd C:\PROGETTI\LYFE
```

### Errore "Remote already exists"
```bash
# Rimuovi e ri-aggiungi il remote
git remote remove origin
git remote add origin https://github.com/welcomepeoplerm/lum.git

```

---

**🎉 Con questi script, gestire Git per il progetto LyfeUmbria sarà semplice e veloce!**