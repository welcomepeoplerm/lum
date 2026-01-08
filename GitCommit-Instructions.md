# GitCommit - Istruzioni per Deployment Automatizzato

## 📋 Processo da Seguire al Comando "GitCommit"

### 🔄 Step 1: Richiesta Conferma
**SEMPRE** chiedere conferma all'utente prima di procedere:

```
🤖 **GitCommit Process Initiated**

Modifiche rilevate nel progetto. Vuoi procedere con:
- ✅ Git add, commit e push
- 🏗️ Build di produzione  
- 🚀 Deploy su Firebase Hosting
- 📦 Aggiornamento versioni/tag (se necessario)

Confermi di voler procedere? (Rispondi "sì", "yes", "ok", o "procedi")
```

### ⏸️ Step 2: Attesa Risposta
- **ATTENDERE** obbligatoriamente una risposta esplicita dell'utente
- **NON PROCEDERE** senza conferma positiva
- Risposte valide: "sì", "yes", "ok", "procedi", "vai", "conferma"
- Se la risposta è negativa o dubbia, **FERMARSI** e chiedere chiarimenti

### 🚀 Step 3: Esecuzione Automatizzata (SOLO dopo conferma)

#### 3.1 Git Operations
```bash
git add .
git status  # Verificare modifiche
```

#### 3.2 Commit con Messaggio Informativo
Creare commit message strutturato seguendo questo template:
```
[EMOJI] [TITOLO BREVE]

🎯 Modifiche Principali:
- [Lista delle funzionalità aggiunte/modificate]

🔧 Dettagli Tecnici:
- [Modifiche ai componenti]
- [Nuovi metodi/funzioni]
- [Aggiornamenti dipendenze]

📱 Miglioramenti UX:
- [Miglioramenti interfaccia utente]
- [Ottimizzazioni performance]

✅ [Stato testing]
🚀 [Stato deployment]
```

#### 3.3 Push e Verifiche
```bash
git commit -m "[MESSAGGIO STRUTTURATO]"
git push origin main
git log --oneline -3  # Verificare commit
```

#### 3.4 Build di Produzione
```bash
npm run build
# Verificare che il build sia successful prima di procedere
```

#### 3.5 Firebase Deploy
```bash
firebase deploy
# Confermare deployment successful
```

#### 3.6 Verifiche Post-Deploy
```bash
# Aprire https://lyfeumbria.web.app per verifica
```

### 📦 Step 4: Tag e Versioning (Se Richiesto)

Se le modifiche rappresentano una versione stabile o milestone:

#### 4.1 Creazione Tag
```bash
git tag -a v[X.X.X] -m "[DESCRIZIONE VERSIONE]"
git push origin v[X.X.X]
```

#### 4.2 Branch di Backup (Per versioni stabili)
```bash
git checkout -b backup-v[X.X.X]-stable
git push origin backup-v[X.X.X]-stable
git checkout main
```

### 🎯 Step 5: Report Finale
Al completamento, fornire sempre un report strutturato:

```
✅ **GitCommit Process Completed Successfully**

📊 Operazioni Eseguite:
- ✅ Git: Add, Commit, Push completati
- ✅ Build: Compilazione successful 
- ✅ Deploy: https://lyfeumbria.web.app aggiornato
- ✅ [Eventuali tag/backup creati]

🔗 Links:
- Repository: https://github.com/welcomepeoplerm/lum
- Live App: https://lyfeumbria.web.app
- Console: https://console.firebase.google.com/project/lyfeumbria

🚀 Applicazione pronta per l'uso!
```

## ⚠️ Regole Importanti

### 🚫 NON FARE MAI:
- Procedere senza conferma esplicita dell'utente
- Committare se ci sono errori di compilazione
- Deployare se il build fallisce
- Creare tag senza una ragione specifica

### ✅ SEMPRE FARE:
- Chiedere conferma prima di ogni GitCommit
- Verificare che non ci siano conflitti Git
- Testare il build prima del deploy
- Fornire feedback di ogni step
- Verificare che il deployment sia successful

### 🔄 In Caso di Errori:
- Fermare immediatamente il processo
- Riportare l'errore specifico all'utente  
- Suggerire soluzioni quando possibile
- NON procedere fino alla risoluzione

## 📝 Note Aggiuntive

- Questo processo è pensato per il progetto LyfeUmbria Manager
- Adattare emoji e messaggi in base al tipo di modifica
- Mantenere sempre un tone professionale ma friendly
- Aggiornare queste istruzioni se necessario

---
*Creato: Gennaio 2026*  
*Progetto: LyfeUmbria Manager*  
*Scopo: Automazione deployment sicura*