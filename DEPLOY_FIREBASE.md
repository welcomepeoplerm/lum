# 🚀 DEPLOY SU FIREBASE HOSTING - GUIDA RAPIDA

## ✅ Prerequisiti Completati
- ✅ Progetto configurato per export statico  
- ✅ firebase.json creato
- ✅ Script di build configurati
- ✅ Build testato con successo

## 📝 Prossimi Passi

### 1. Installa Firebase CLI
```powershell
npm install -g firebase-tools
```

### 2. Login a Firebase
```powershell
firebase login
```

### 3. Inizializza Firebase nel progetto
```powershell
firebase init
```
**Seleziona:**
- ✅ Hosting: Configure files for Firebase Hosting
- 🔄 Use existing project: **lyfeumbria** (il tuo progetto Firebase)
- 📁 Public directory: **out** (già configurato)
- 🔄 Configure as single-page app: **Yes**
- ❌ Set up automatic builds: **No** (per ora)

### 4. Deploy
```powershell
# Deploy completo
npm run deploy

# O in due passi separati
npm run build
firebase deploy --only hosting
```

## 🌐 Dopo il Deploy

### URL del sito:
- **Firebase**: https://lyfeumbria.web.app
- **Custom domain** (se configurato): https://tuodominio.com

### Gestione Deploy:
```powershell
# Deploy solo hosting
firebase deploy --only hosting

# Vedi deploy attivi  
firebase hosting:sites:list

# Rollback se necessario
firebase hosting:releases:rollback
```

## 🔧 Configurazioni Avanzate

### Dominio Personalizzato
1. Vai su Firebase Console → Hosting
2. "Add custom domain"
3. Segui le istruzioni per i record DNS

### Variabili d'Ambiente
Le variabili in `.env.local` vengono incluse automaticamente nel build statico per le variabili che iniziano con `NEXT_PUBLIC_`.

## 📊 Monitoraggio
- **Firebase Console**: https://console.firebase.google.com/project/lyfeumbria/hosting
- **Analytics**: Attivabili dalla console
- **Performance Monitoring**: Attivabile da Firebase Console

---

## 🚨 Note Importanti
- Le variabili d'ambiente vengono incluse nel bundle client (visibili agli utenti)
- Il sito è completamente statico (niente server-side rendering)
- Tutte le operazioni database avvengono lato client tramite Firebase SDK