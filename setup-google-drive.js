#!/usr/bin/env node

/**
 * Script di Setup per Google Drive Integration
 * Configura automaticamente le variabili d'ambiente per l'integrazione con Google Drive
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setup Google Drive Integration per LyfeUmbria Manager\n');

const questions = [
  {
    key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    question: '📝 Inserisci il Google Client ID (formato: xxxxx.apps.googleusercontent.com): ',
    validation: (value) => value.includes('.apps.googleusercontent.com'),
    error: 'Il Client ID deve terminare con .apps.googleusercontent.com'
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    question: '🔐 Inserisci il Google Client Secret (formato: GOCSPX-xxxxx): ',
    validation: (value) => value.startsWith('GOCSPX-') && value.length > 20,
    error: 'Il Client Secret deve iniziare con GOCSPX- ed essere più lungo di 20 caratteri'
  },
  {
    key: 'NEXT_PUBLIC_REDIRECT_URI',
    question: '🌐 Inserisci l\'URI di redirect (default: http://localhost:3000/auth/callback): ',
    default: 'http://localhost:3000/auth/callback',
    validation: (value) => value.includes('/auth/callback'),
    error: 'L\'URI deve terminare con /auth/callback'
  }
];

async function askQuestion(questionObj) {
  return new Promise((resolve) => {
    rl.question(questionObj.question, (answer) => {
      const value = answer.trim() || questionObj.default;
      
      if (questionObj.validation && !questionObj.validation(value)) {
        console.log(`❌ ${questionObj.error}\n`);
        resolve(askQuestion(questionObj)); // Richiedi nuovamente
      } else {
        resolve(value);
      }
    });
  });
}

async function setup() {
  try {
    console.log('Prima di continuare, assicurati di aver:');
    console.log('✅ Creato un progetto su Google Cloud Console');
    console.log('✅ Abilitato Google Drive API');
    console.log('✅ Configurato OAuth2 credentials');
    console.log('✅ Impostato la schermata consenso OAuth\n');
    
    const proceed = await new Promise((resolve) => {
      rl.question('Continuare con il setup? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (!proceed) {
      console.log('Setup annullato. Consulta CONFIGURAZIONE_ACCESSO_GOOGLE.md per la guida completa.');
      rl.close();
      return;
    }

    console.log('\n🔧 Configurazione variabili d\'ambiente...\n');

    const config = {};
    
    for (const question of questions) {
      config[question.key] = await askQuestion(question);
    }

    // Crea il contenuto del file .env.local
    const envContent = `# Google OAuth2 Configuration per LyfeUmbria Manager
# Generato automaticamente il ${new Date().toLocaleString()}

# Client ID pubblico per l'autenticazione OAuth2
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${config.NEXT_PUBLIC_GOOGLE_CLIENT_ID}

# Client Secret (PRIVATO - non condividere)
GOOGLE_CLIENT_SECRET=${config.GOOGLE_CLIENT_SECRET}

# URL di redirect per l'autenticazione
NEXT_PUBLIC_REDIRECT_URI=${config.NEXT_PUBLIC_REDIRECT_URI}

# Firebase Configuration (se necessario per altre funzionalità)
# NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
`;

    // Scrive il file .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(envPath)) {
      const overwrite = await new Promise((resolve) => {
        rl.question('\n⚠️  Il file .env.local esiste già. Sovrascrivere? (y/n): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
      
      if (!overwrite) {
        console.log('Setup annullato per preservare il file esistente.');
        rl.close();
        return;
      }
      
      // Backup del file esistente
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      console.log(`📋 Backup creato: ${backupPath}`);
    }

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Setup completato con successo!');
    console.log(`📁 File creato: ${envPath}\n`);
    
    console.log('🚀 Prossimi passi:');
    console.log('1. Avvia il server di sviluppo: npm run dev');
    console.log('2. Vai su http://localhost:3000');
    console.log('3. Naviga alla sezione "Documenti"');
    console.log('4. Testa l\'autenticazione con Google\n');
    
    console.log('📖 Per informazioni dettagliate, consulta:');
    console.log('   - CONFIGURAZIONE_ACCESSO_GOOGLE.md');
    console.log('   - GOOGLE_DRIVE_SETUP.md');

  } catch (error) {
    console.error('\n❌ Errore durante il setup:', error.message);
  } finally {
    rl.close();
  }
}

// Avvia il setup
setup();