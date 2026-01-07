#!/usr/bin/env node

/**
 * Script di Diagnostica Google Drive Integration
 * Verifica la configurazione e la connettività con Google APIs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Diagnostica Google Drive Integration\n');

// Verifica file .env.local
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ File .env.local non trovato');
    console.log('   Esegui: npm run setup:google\n');
    return false;
  }
  
  console.log('✅ File .env.local trovato');
  
  // Leggi e verifica variabili
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_REDIRECT_URI'
  ];
  
  let allVarsFound = true;
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`✅ ${varName} configurata`);
    } else {
      console.log(`❌ ${varName} mancante o non configurata`);
      allVarsFound = false;
    }
  });
  
  return allVarsFound;
}

// Verifica connettività Google APIs
function checkGoogleAPIs() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/drive/v3/about',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 401) {
        console.log('✅ Google Drive API raggiungibile (401 atteso senza auth)');
        resolve(true);
      } else {
        console.log(`⚠️  Google Drive API response: ${res.statusCode}`);
        resolve(true);
      }
    });

    req.on('error', (err) => {
      console.log('❌ Google Drive API non raggiungibile:', err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout connessione Google Drive API');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Verifica structure file progetto
function checkProjectStructure() {
  const requiredFiles = [
    'src/hooks/useGoogleAuth.tsx',
    'src/lib/googleDrive.ts',
    'src/components/DocumentManagement.tsx',
    'src/app/api/auth/google/callback/route.ts',
    'src/app/api/auth/google/refresh/route.ts',
    'src/app/auth/callback/page.tsx'
  ];
  
  let allFilesExist = true;
  
  console.log('\n📁 Verifica struttura progetto:');
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`);
    } else {
      console.log(`❌ ${filePath} mancante`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Verifica dipendenze npm
function checkDependencies() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json non trovato');
    return false;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    'lucide-react',
    'react-hook-form'
  ];
  
  console.log('\n📦 Verifica dipendenze:');
  
  let allDepsInstalled = true;
  
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies && packageContent.dependencies[dep]) {
      console.log(`✅ ${dep} v${packageContent.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} mancante`);
      allDepsInstalled = false;
    }
  });
  
  return allDepsInstalled;
}

// Test configurazione Google OAuth
async function testOAuthConfig() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Estrai CLIENT_ID
  const clientIdMatch = envContent.match(/NEXT_PUBLIC_GOOGLE_CLIENT_ID=(.+)/);
  if (!clientIdMatch) {
    console.log('❌ CLIENT_ID non trovato');
    return false;
  }
  
  const clientId = clientIdMatch[1].trim();
  
  // Verifica formato CLIENT_ID
  if (!clientId.includes('.apps.googleusercontent.com')) {
    console.log('❌ Formato CLIENT_ID non valido');
    return false;
  }
  
  console.log(`✅ CLIENT_ID formato valido: ${clientId.substring(0, 20)}...`);
  
  return true;
}

// Funzione principale
async function runDiagnostics() {
  console.log('='.repeat(60));
  console.log('🏁 Avvio diagnostica...\n');
  
  const results = {
    envFile: false,
    projectStructure: false,
    dependencies: false,
    oauthConfig: false,
    googleAPIs: false
  };
  
  // 1. Verifica file .env.local
  console.log('1️⃣ Verifica configurazione ambiente:');
  results.envFile = checkEnvFile();
  
  // 2. Verifica struttura progetto
  results.projectStructure = checkProjectStructure();
  
  // 3. Verifica dipendenze
  results.dependencies = checkDependencies();
  
  // 4. Test configurazione OAuth
  console.log('\n🔐 Verifica configurazione OAuth:');
  results.oauthConfig = await testOAuthConfig();
  
  // 5. Test connettività Google APIs
  console.log('\n🌐 Verifica connettività Google APIs:');
  results.googleAPIs = await checkGoogleAPIs();
  
  // Risultato finale
  console.log('\n' + '='.repeat(60));
  console.log('📊 RISULTATO DIAGNOSTICA\n');
  
  const allTestsPassed = Object.values(results).every(result => result);
  
  if (allTestsPassed) {
    console.log('🎉 Tutti i test superati! La configurazione è corretta.');
    console.log('\n🚀 Prossimi passi:');
    console.log('   1. Avvia: npm run dev');
    console.log('   2. Vai su: http://localhost:3000');
    console.log('   3. Testa la sezione "Documenti"');
  } else {
    console.log('⚠️  Alcuni problemi rilevati. Verifica i dettagli sopra.\n');
    
    if (!results.envFile) {
      console.log('🔧 Per configurare le variabili d\'ambiente: npm run setup:google');
    }
    
    if (!results.projectStructure) {
      console.log('🔧 Verifica che tutti i file del progetto siano presenti');
    }
    
    if (!results.dependencies) {
      console.log('🔧 Installa le dipendenze mancanti: npm install');
    }
    
    console.log('\n📖 Consulta: CONFIGURAZIONE_ACCESSO_GOOGLE.md');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Avvia diagnostica
runDiagnostics().catch(err => {
  console.error('❌ Errore durante la diagnostica:', err);
});