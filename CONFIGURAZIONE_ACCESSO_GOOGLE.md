# Configurazione Accesso Google Drive - Guida Completa

## 🔧 Configurazione Google Cloud Console

### 1. Creazione Progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Clicca su "Seleziona un progetto" → "Nuovo progetto"
3. Inserisci nome progetto (es: "lyfe-umbria-manager")
4. Clicca "Crea"

### 2. Abilitazione API necessarie

1. Nel menu laterale, vai su **API e servizi** → **Libreria**
2. Abilita le seguenti API:
   - **Google Drive API**
   - **Google+ API** (per informazioni utente)
   - **Google OAuth2 API**

### 3. Configurazione OAuth2

1. Nel menu laterale, vai su **API e servizi** → **Credenziali**
2. Clicca **+ CREA CREDENZIALI** → **ID client OAuth 2.0**
3. Seleziona **Applicazione web**
4. Configura:
   - **Nome**: "LyfeUmbria Manager"
   - **URI di redirect autorizzati**:
     - `http://localhost:3000/auth/callback` (per sviluppo)
     - `https://tuodominio.com/auth/callback` (per produzione)
   - **Origini JavaScript autorizzate**:
     - `http://localhost:3000` (per sviluppo)
     - `https://tuodominio.com` (per produzione)
5. Clicca **Crea**
6. **SALVA** il Client ID e Client Secret generati

### 4. Configurazione Schermata Consenso OAuth

1. Vai su **API e servizi** → **Schermata consenso OAuth**
2. Seleziona **Esterno** se l'app sarà pubblica
3. Compila i campi obbligatori:
   - **Nome applicazione**: "LyfeUmbria Manager"
   - **Email di supporto**: la tua email
   - **Dominio autorizzato**: il tuo dominio (se applicabile)
4. Aggiungi **Ambiti**:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Salva e continua

## ⚙️ Configurazione Ambiente di Sviluppo

### 1. File delle Variabili d'Ambiente

1. Copia `.env.local.example` in `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Modifica `.env.local` con i tuoi valori:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

### 2. Test della Configurazione

1. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

2. Vai su `http://localhost:3000`
3. Naviga alla sezione "Documenti"
4. Clicca su "Accedi con Google"
5. Completa l'autenticazione

## 🔒 Sicurezza e Best Practices

### Variabili d'Ambiente
- ✅ **NEVER** committare `.env.local` nel repository
- ✅ Il `GOOGLE_CLIENT_SECRET` deve rimanere privato
- ✅ Il `NEXT_PUBLIC_GOOGLE_CLIENT_ID` può essere pubblico
- ✅ Usa sempre HTTPS in produzione

### OAuth2 Settings
- ✅ Limita i domini autorizzati solo ai tuoi
- ✅ Usa redirect URI specifici (non wildcard)
- ✅ Implementa scadenza token appropriata
- ✅ Monitora l'uso delle API nella Console Google

## 🌐 Configurazione per Produzione

### 1. Aggiorna URI di Redirect
Nella Google Cloud Console, aggiungi:
- `https://tuodominio.com/auth/callback`

### 2. Variabili d'Ambiente Produzione
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=il_tuo_client_id
GOOGLE_CLIENT_SECRET=il_tuo_client_secret
NEXT_PUBLIC_REDIRECT_URI=https://tuodominio.com/auth/callback
```

### 3. Verifica Domini
- Aggiungi il tuo dominio nei "Domini autorizzati"
- Aggiorna le "Origini JavaScript autorizzate"

## 🚨 Risoluzione Problemi Comuni

### Errore "redirect_uri_mismatch"
- Verifica che l'URI in `.env.local` corrisponda a quello in Google Console
- Controlla che non ci siano spazi extra o caratteri nascosti

### Errore "access_denied"
- Controlla la configurazione della schermata consenso OAuth
- Verifica che gli ambiti richiesti siano autorizzati

### Token scaduti
- Il sistema implementa refresh automatico
- I token vengono salvati in localStorage
- Logout/login per forzare il rinnovo

### Popup bloccato
- Permetti popup per il tuo dominio
- Usa browser supportati (Chrome, Firefox, Safari, Edge)

## 📋 Checklist Pre-Deploy

- [ ] Google Cloud Project creato
- [ ] API Google Drive abilitata
- [ ] OAuth2 credentials configurate
- [ ] Schermata consenso configurata
- [ ] URI di redirect aggiornati
- [ ] Variabili d'ambiente impostate
- [ ] Test autenticazione completato
- [ ] Domini di produzione aggiunti

## 📞 Supporto

Per problemi di configurazione:
1. Controlla la Console Google Cloud per messaggi di errore
2. Verifica i logs del browser (F12 → Console)
3. Controlla i logs del server Next.js
4. Documenta l'errore esatto per il supporto tecnico