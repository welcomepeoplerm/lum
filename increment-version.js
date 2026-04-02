/**
 * Script per incrementare automaticamente la versione dell'applicazione
 * 
 * Uso: node increment-version.js
 * 
 * Logica versioning:
 * - Versione formato X.Y
 * - Y va da 0 a 9
 * - Quando Y raggiunge 9, la prossima versione incrementa X e resetta Y a 0
 * 
 * Esempi:
 * 1.0 -> 1.1 -> 1.2 ... -> 1.9 -> 2.0 -> 2.1 ...
 */

const fs = require('fs');
const path = require('path');

// Path del file version.json
const versionFilePath = path.join(__dirname, 'version.json');

try {
  // Leggi il file version.json
  const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  const currentVersion = versionData.version;
  
  console.log(`📦 Versione corrente: ${currentVersion}`);
  
  // Parse della versione corrente
  const [major, minor] = currentVersion.split('.').map(Number);
  
  // Calcola la nuova versione
  let newMajor = major;
  let newMinor = minor + 1;
  
  // Se minor raggiunge 10, incrementa major e resetta minor
  if (newMinor > 9) {
    newMajor = major + 1;
    newMinor = 0;
  }
  
  const newVersion = `${newMajor}.${newMinor}`;
  
  // Aggiorna il file version.json
  versionData.version = newVersion;
  versionData.lastUpdated = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');
  
  console.log(`✅ Versione aggiornata: ${newVersion}`);
  console.log(`📅 Data aggiornamento: ${versionData.lastUpdated}`);
  
  // Aggiorna anche il package.json se esiste
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`📦 package.json aggiornato alla versione ${newVersion}`);
  }
  
} catch (error) {
  console.error('❌ Errore durante l\'incremento della versione:', error.message);
  process.exit(1);
}
