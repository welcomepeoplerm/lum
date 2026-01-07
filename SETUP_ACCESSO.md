# 🔐 Configurazione Accesso Google Drive

Questa guida ti aiuterà a configurare l'accesso a Google Drive per il sistema di gestione documentale di LyfeUmbria Manager.

## 🚀 Setup Rapido (Raccomandato)

### 1. Setup Automatico
```bash
npm run setup:google
```
Questo script interattivo ti guiderà nella configurazione delle variabili d'ambiente necessarie.

### 2. Test della Configurazione
```bash
npm run diagnose:google
```
Verifica che tutto sia configurato correttamente prima di procedere.

### 3. Avvio dell'Applicazione
```bash
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:3000`

## 📋 Prerequisiti Google Cloud

Prima di eseguire il setup automatico, assicurati di aver completato questi passaggi nella [Google Cloud Console](https://console.cloud.google.com):

### ✅ Checklist Prerequisiti
- [ ] Progetto Google Cloud creato
- [ ] Google Drive API abilitata
- [ ] Google+ API abilitata (per info utente)
- [ ] Credenziali OAuth2 create (tipo: Applicazione Web)
- [ ] Schermata consenso OAuth configurata
- [ ] URI di redirect aggiunti:
  - `http://localhost:3000/auth/callback` (sviluppo)
  - Il tuo dominio di produzione (se applicabile)

## 🛠️ Setup Manuale

Se preferisci configurare manualmente:

### 1. Copia il file template
```bash
copy .env.local.example .env.local
```

### 2. Modifica `.env.local` con i tuoi valori:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tuo_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tuo_client_secret
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Verifica la configurazione
```bash
npm run diagnose:google
```

## 🔍 Verifica del Funzionamento

1. **Avvia l'applicazione**: `npm run dev`
2. **Vai alla dashboard**: `http://localhost:3000`
3. **Clicca su "Documenti"** nella barra di navigazione
4. **Clicca "Accedi con Google"**
5. **Completa l'autenticazione** nel popup
6. **Verifica l'accesso** ai file di Google Drive

## ⚠️ Risoluzione Problemi

### Problema: "redirect_uri_mismatch"
```
❌ Errore: The redirect URI in the request does not match
```
**Soluzione**: Verifica che l'URI in `.env.local` corrisponda esattamente a quello configurato in Google Cloud Console.

### Problema: "access_denied"
```
❌ Errore: Error 403: access_denied
```
**Soluzione**: Controlla la configurazione della schermata consenso OAuth e verifica che gli scope siano corretti.

### Problema: "Popup blocked"
```
❌ Impossibile aprire la finestra di autenticazione
```
**Soluzione**: Abilita i popup per il tuo dominio nelle impostazioni del browser.

### Problema: "Token expired"
```
❌ Token scaduto, necessario nuovo login
```
**Soluzione**: Il sistema dovrebbe rinnovare automaticamente i token. Se il problema persiste, effettua logout e nuovo login.

## 🔐 Sicurezza

### ⚠️ IMPORTANTE
- **MAI** condividere il `GOOGLE_CLIENT_SECRET`
- **MAI** committare il file `.env.local` nel repository
- Usa sempre **HTTPS** in produzione
- Limita gli URI di redirect solo ai tuoi domini

### 📁 File Sensibili
Questi file non devono mai essere condivisi:
- `.env.local` - Contiene le credenziali
- `lyfeumbria-firebase-adminsdk-*.json` - Chiavi Firebase

## 🌐 Configurazione Produzione

Per il deploy in produzione:

### 1. Aggiorna Google Cloud Console
- Aggiungi il dominio di produzione agli URI di redirect
- Aggiorna le origini JavaScript autorizzate

### 2. Configura le variabili d'ambiente
Nel tuo servizio di hosting (Vercel, Netlify, etc.):
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tuo_client_id
GOOGLE_CLIENT_SECRET=tuo_client_secret
NEXT_PUBLIC_REDIRECT_URI=https://tuodominio.com/auth/callback
```

## 📞 Supporto

### Script di Diagnostica
```bash
npm run diagnose:google
```
Questo script verifica:
- ✅ Presenza file di configurazione
- ✅ Struttura progetto corretta
- ✅ Dipendenze installate
- ✅ Connettività Google APIs
- ✅ Formato delle credenziali

### Log di Debug
Per debugging avanzato, controlla:
- **Browser Console**: F12 → Console
- **Network Tab**: F12 → Network
- **Server Logs**: Terminal dove hai avviato `npm run dev`

### File di Documentazione
- [`CONFIGURAZIONE_ACCESSO_GOOGLE.md`](./CONFIGURAZIONE_ACCESSO_GOOGLE.md) - Guida dettagliata
- [`GOOGLE_DRIVE_SETUP.md`](./GOOGLE_DRIVE_SETUP.md) - Setup completo
- [`README.md`](./README.md) - Documentazione generale del progetto

---

🎉 **Una volta completata la configurazione, potrai gestire i documenti direttamente da Google Drive attraverso l'interfaccia di LyfeUmbria Manager!**