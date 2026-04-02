# Script PowerShell per Deploy con Incremento Versione Automatico
# 
# Uso: .\deploy-with-version.ps1
#
# Questo script:
# 1. Incrementa automaticamente la versione
# 2. Compila il progetto
# 3. Effettua il deploy su Firebase

Write-Host "`n🚀 Deploy LyfeUmbria Manager con incremento versione`n" -ForegroundColor Cyan

# Step 1: Incrementa versione
Write-Host "📦 Step 1/3: Incremento versione..." -ForegroundColor Yellow
node increment-version.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Errore durante l'incremento della versione" -ForegroundColor Red
    exit 1
}

# Step 2: Build del progetto
Write-Host "`n🔨 Step 2/3: Compilazione progetto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Errore durante la compilazione" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy su Firebase
Write-Host "`n☁️  Step 3/3: Deploy su Firebase..." -ForegroundColor Yellow
firebase deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Errore durante il deploy" -ForegroundColor Red
    exit 1
}

# Leggi la nuova versione
$versionData = Get-Content version.json | ConvertFrom-Json
$newVersion = $versionData.version

Write-Host "`n✅ Deploy completato con successo!" -ForegroundColor Green
Write-Host "📌 Versione deployata: v$newVersion" -ForegroundColor Cyan
Write-Host "📅 Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor Gray
Write-Host ""
