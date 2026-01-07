# 🚀 Istruzioni per Deploy in Produzione - LUM Manager

## ✅ Checklist Pre-Deploy

Prima di ogni deploy, verifica:

1. **Server di sviluppo spento**
   - Se è attivo, ferma con `Ctrl+C` nel terminale
   - Oppure: `Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force`

2. **Modifiche salvate**
   - Tutte le modifiche ai file sono salvate
   - Non ci sono errori TypeScript o ESLint

## 🔥 Comando Deploy Rapido

```powershell
npm run deploy
```

**Questo comando fa tutto automaticamente:**
- ✅ Build del progetto (`next build`)
- ✅ Upload su Firebase Hosting
- ✅ Deploy su https://lyfeumbria.web.app

## 📝 Deploy Step-by-Step

Se preferisci il controllo manuale:

### 1. Ferma il server di sviluppo
```powershell
# Se necessario
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

### 2. Crea il build di produzione
```powershell
npm run build
```

### 3. Deploy su Firebase
```powershell
firebase deploy --only hosting
```

## ⚠️ Risoluzione Problemi

### Errore: "Firebase CLI not found"
```powershell
npm install -g firebase-tools
firebase login
```

### Errore: "Project not initialized"
```powershell
firebase init hosting
# Seleziona il progetto "lyfeumbria"
# Public directory: "out"
# Single-page app: "Yes"
```

### Errore di Build TypeScript
1. Controlla gli errori nel terminale
2. Risolvi gli errori nel codice
3. Riprova il deploy

### Errore: "Process already running"
```powershell
# Ferma tutti i processi Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Rimuovi eventuali lock file
Remove-Item -Path ".\.next\dev\lock" -Force -ErrorAction SilentlyContinue

# Riprova il deploy
npm run deploy
```

## 🌐 URL di Produzione

Dopo il deploy, il sito sarà disponibile su:
- **URL principale**: https://lyfeumbria.web.app
- **URL alternativo**: https://lyfeumbria.firebaseapp.com

## 📊 Monitoraggio Deploy

Per verificare lo stato del deploy:
```powershell
firebase hosting:sites:list
```

## 🔄 Deploy Veloce - Procedura Standard

**Per deployment quotidiani, usa questi 3 comandi:**

```powershell
# 1. Ferma il server di sviluppo (se attivo)
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# 2. Deploy completo
npm run deploy

# 3. Verifica (opzionale)
echo "Deploy completato! Controlla https://lyfeumbria.web.app"
```

---

## 💡 Tips per Deploy Rapidi

- **Deploy dopo ogni modifica importante**
- **Testa sempre in locale prima del deploy** (`npm run dev`)
- **Il deploy richiede circa 1-2 minuti**
- **Non è necessario fare logout/login da Firebase ogni volta**
- **Il sito si aggiorna automaticamente dopo il deploy**

---

*Ultima modifica: 5 Gennaio 2026*
*Progetto: LyfeUmbria Manager v1.0*