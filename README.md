# LyfeUmbria Manager - Sistema di Gestione Turistico

Una web application moderna per la gestione di un casale turistico, sviluppata con Next.js, TypeScript, Tailwind CSS e Firebase/Firestore.

## 🌟 Funzionalità

### ✅ Autenticazione
- Login sicuro con email e password
- Gestione sessioni utente
- Controllo accessi basato sui ruoli

### ✅ Gestione Utenti (Solo Admin)
- Creazione nuovi utenti
- Assegnazione ruoli (admin/user)
- Modifica e eliminazione utenti
- Vista tabellare con informazioni complete

### ✅ Dashboard Amministrativa
- Interfaccia responsive e moderna
- Navigazione intuitiva con sidebar
- Dashboard generale del sistema
- Menu adattivo per dispositivi mobili

### ✅ To-Do List
- **ID**: Generato automaticamente (sequence)
- **Data Inserimento**: Timestamp automatico
- **Attività**: Campo stringa descrittivo
- **Fatto**: Campo boolean (Si/No)
- Operazioni CRUD complete
- Filtro per utente corrente
- Contatori attività totali/completate

### ✅ Gestione Documentale (Google Drive)
- **Integrazione Google Drive**: Spazio dedicato per documenti
- **Upload documenti**: Caricamento diretto su Google Drive
- **Visualizzazione file**: Anteprima e download documenti
- **Ricerca avanzata**: Ricerca per nome file e contenuto
- **Organizzazione**: Creazione di cartelle e sottocartelle
- **Condivisione**: Sistema di permessi e condivisione file
- **Eliminazione sicura**: Gestione completa del ciclo vita documenti

## 🏗️ Stack Tecnologico

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Firebase Auth
- **Database**: Firestore (Google Cloud)
- **Deploy**: Ready for Google Cloud Platform
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 🚀 Setup del Progetto

### 1. Installazione Dipendenze
```bash
npm install
```

### 2. Configurazione Firebase

1. Crea un nuovo progetto Firebase su [console.firebase.google.com](https://console.firebase.google.com)
2. Abilita Authentication (Email/Password)
3. Crea un database Firestore
4. Copia le credenziali nel file `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Configurazione Google Drive API

Per abilitare la gestione documentale con Google Drive:

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le API: "Google Drive API" e "Google Sheets API"
4. Crea credenziali OAuth2 per applicazione web
5. Configura gli URI di redirect autorizzati:
   - `http://localhost:3000/auth/callback` (sviluppo)
   - `https://your-domain.com/auth/callback` (produzione)

6. Copia le credenziali nel file `.env.local`:

```env
# Credenziali Google Drive API
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
```

7. (Opzionale) Per operazioni server-side, crea un Service Account:
   - Scarica il file JSON delle credenziali
   - Salva il file in una posizione sicura
   - Aggiungi il path nel `.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json
   ```

### 4. Regole Firestore

Configura le regole di sicurezza in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
                     resource.data.role == 'admin' && 
                     request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Todos collection - users can only access their own todos
    match /todos/{todoId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Primo Utente Admin

Per creare il primo utente amministratore:

1. Avvia l'app: `npm run dev`
2. Nella console Firebase Authentication, crea manualmente il primo utente
3. Aggiungi il documento in Firestore nella collezione `users`:

```json
{
  "name": "Admin",
  "email": "admin@casale.com",
  "role": "admin",
  "createdAt": "2026-01-03T00:00:00Z"
}
```

## 🖥️ Comandi Disponibili

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build

# Avvio produzione
npm start

# Linting
npm run lint
```

## 📱 Responsive Design

L'applicazione è completamente responsive e ottimizzata per:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔐 Sicurezza

- Autenticazione Firebase con controllo sessioni
- Regole Firestore per controllo accessi
- Validazione input lato client e server
- Protezione CSRF integrata in Next.js

## 🌐 Deploy su Google Cloud Platform

L'applicazione è pronta per il deploy su GCP. Configurazioni consigliate:

1. **Cloud Run**: Per container Docker
2. **App Engine**: Per hosting managed
3. **Firebase Hosting**: Per hosting statico

Guida dettagliata per il deploy disponibile nella documentazione GCP.

## 📂 Struttura del Progetto

```
src/
├── app/                 # App Router di Next.js
├── components/          # Componenti React riutilizzabili
├── hooks/              # Custom React Hooks
├── lib/                # Utilità e configurazioni
└── types/              # Definizioni TypeScript
```

## 🎯 Prossimi Sviluppi

- [ ] Sistema di prenotazioni
- [ ] Calendario disponibilità  
- [ ] Gestione pagamenti
- [ ] Notifiche email/SMS
- [ ] Sistema di recensioni
- [ ] Dashboard analytics
- [ ] App mobile companion
- [ ] Integrazione avanzata Google Workspace (Sheets, Docs)

## 👥 Contributori

Sviluppato per la gestione del casale turistico con tecnologie moderne e scalabili.

---

*Per supporto tecnico o domande, consulta la documentazione Firebase e Next.js ufficiali.*
