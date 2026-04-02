# Configurazione Email - LyfeUmbria

## Panoramica

Il sistema di invio email utilizza **Gmail** tramite **Nodemailer** nelle Firebase Cloud Functions. Questo permette di inviare email gratuitamente (fino a 500/giorno con account Gmail personale).

### Funzionalità

- **Invio email manuale** dalla dashboard admin
- **Notifiche automatiche scadenze** (giornaliere alle 8:00)
- **Log completo** di tutte le email inviate
- **Configurazione da UI** senza dover modificare codice

---

## Setup Iniziale

### 1. Creare una App Password di Google

> **REQUISITO:** La verifica in 2 passaggi deve essere attiva sull'account Gmail.

1. Vai su [myaccount.google.com](https://myaccount.google.com)
2. **Sicurezza** → assicurati che la **Verifica in 2 passaggi** sia attiva
3. Nella barra di ricerca cerca **"Password per le app"** (o vai su [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
4. Inserisci un nome app: **LyfeUmbria**
5. Clicca **Crea**
6. **Copia la password di 16 caratteri** generata (es. `abcd efgh ijkl mnop`)

### 2. Installare dipendenze Cloud Functions

```bash
cd functions
npm install
```

### 3. Configurare le credenziali

**Metodo A: Dalla UI admin (consigliato)**

1. Avvia l'app e accedi come admin
2. Vai nella sezione **Email** dal menu laterale
3. Inserisci l'email Gmail e la App Password
4. Clicca **Salva Configurazione**
5. Usa il pulsante **Test Connessione** per verificare

**Metodo B: Firebase Functions Config (per produzione)**

```bash
firebase functions:config:set gmail.email="tuoemail@gmail.com" gmail.password="abcdefghijklmnop" gmail.sendername="LyfeUmbria"
```

### 4. Deploy delle Cloud Functions

```bash
firebase deploy --only functions
```

---

## Architettura

### Cloud Functions (`functions/index.js`)

| Funzione | Tipo | Descrizione |
|----------|------|-------------|
| `sendEmail` | `onCall` | Invio email generico (richiede autenticazione) |
| `testEmailConnection` | `onCall` | Verifica connessione al server Gmail |
| `saveEmailConfig` | `onCall` | Salva configurazione email (solo admin) |
| `getEmailConfig` | `onCall` | Legge configurazione (solo admin, senza password) |
| `checkScadenzeAndNotify` | `pubsub.schedule` | Controlla scadenze e invia notifiche (ogni giorno alle 8:00) |

### Client-side (`src/lib/emailService.ts`)

Libreria TypeScript che espone funzioni semplici per chiamare le Cloud Functions:

```typescript
import { sendEmail, testEmailConnection, sendScadenzaReminder } from '@/lib/emailService';

// Invio email semplice
await sendEmail({
  to: 'destinatario@email.com',
  subject: 'Oggetto',
  body: 'Testo del messaggio'
});

// Invio email HTML
await sendEmail({
  to: ['email1@test.com', 'email2@test.com'],
  subject: 'Oggetto',
  html: '<h1>Titolo</h1><p>Contenuto HTML</p>'
});

// Invio promemoria scadenza
await sendScadenzaReminder({
  titolo: 'Pagamento bolletta',
  categoria: 'bollette',
  dataScadenza: new Date('2026-03-15'),
  importo: 150.00,
  priorita: 'alta',
  emails: ['admin@email.com']
});
```

### Componente UI (`src/components/EmailManagement.tsx`)

Accessibile solo agli admin, offre:
- **Tab Configurazione**: setup email Gmail con istruzioni passo-passo
- **Tab Invio Test**: form per testare l'invio
- **Tab Log Invii**: storico di tutte le email inviate/errori

### Collezioni Firestore

| Collezione | Descrizione |
|------------|-------------|
| `emailConfig` | Documento `gmail` con configurazione (email, appPassword, senderName) |
| `emailLogs` | Log di tutte le email inviate con stato, destinatari, timestamp |

---

## Notifiche Automatiche Scadenze

La Cloud Function `checkScadenzeAndNotify` viene eseguita **ogni giorno alle 8:00 (Europe/Rome)** e:

1. Cerca tutte le scadenze **non completate** con data nei **prossimi 3 giorni**
  (invio giornaliero solo quando mancano **3, 2 o 1 giorno** alla scadenza)
2. Per ogni scadenza con indirizzi email associati, invia un'email HTML con:
   - Titolo e descrizione
   - Categoria e priorità (con codice colore)
   - Giorni rimasti alla scadenza
   - Importo (se presente)
3. Logga ogni invio/errore nella collezione `emailLogs`

> Le email dei destinatari vengono prese dal campo `emails[]` di ogni scadenza.

---

## Limiti e Note

- **Gmail gratuito**: 500 email/giorno
- **Google Workspace**: 2.000 email/giorno
- La App Password NON è la password dell'account Google
- La App Password richiede la verifica in 2 passaggi attiva
- Le credenziali salvate in Firestore (`emailConfig`) sono protette dalle Firestore Security Rules
- I log vengono salvati automaticamente per ogni tentativo di invio

---

## Troubleshooting

| Problema | Soluzione |
|----------|----------|
| "Configurazione email mancante" | Configura email dalla UI admin o via `firebase functions:config` |
| "Invalid login" | Verifica di usare una App Password (non la password account) |
| "Less secure app access" | Non serve con App Password; assicurati di usare App Password |
| Email non arrivano | Controlla la cartella spam del destinatario |
| Errore "quota exceeded" | Hai superato il limite giornaliero di Gmail (500/giorno) |
| Cloud Function non trovata | Esegui `firebase deploy --only functions` |
