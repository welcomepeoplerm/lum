# Sistema di Versioning Automatico - LyfeUmbria Manager

## 📋 Panoramica

Il sistema di versioning automatico è stato implementato per tenere traccia delle versioni dell'applicazione. La versione viene visualizzata nel menu laterale accanto al logo "LUM".

## 🔢 Formato Versione

La versione segue il formato **X.Y** dove:
- **X** = Numero major (versione principale)
- **Y** = Numero minor (incremento deploy)

### Regole di Incremento

- Ogni deploy incrementa Y di 1
- Quando Y raggiunge 9, la prossima versione incrementa X e resetta Y a 0
- Esempio: `1.0 → 1.1 → 1.2 → ... → 1.9 → 2.0 → 2.1 → ...`

## 📁 File Coinvolti

### 1. `version.json`
File di configurazione che contiene la versione corrente:
```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-15"
}
```

### 2. `src/lib/version.ts`
Modulo TypeScript per gestire la versione:
```typescript
import versionData from '../../version.json';
export const APP_VERSION = versionData.version;
```

### 3. `increment-version.js`
Script Node.js che incrementa automaticamente la versione:
```bash
node increment-version.js
```

### 4. `src/components/Dashboard.tsx`
Visualizza la versione nel menu:
```tsx
<h1>LUM</h1>
<span>v{APP_VERSION}</span>
```

## 🚀 Come Usare

### Metodo 1: Incremento Manuale
```bash
npm run version:increment
```

Questo comando:
- Legge la versione corrente da `version.json`
- La incrementa seguendo le regole
- Aggiorna `version.json` e `package.json`
- Mostra la nuova versione nel terminale

### Metodo 2: Deploy Automatico (Raccomandato)
```bash
npm run deploy
```

Questo comando esegue automaticamente:
1. `npm run version:increment` - Incrementa la versione
2. `npm run build` - Compila il progetto
3. `firebase deploy` - Deploy su Firebase

**Nota:** Lo script `predeploy` nel package.json gestisce automaticamente l'incremento.

## 📊 Esempio Pratico

```bash
# Situazione iniziale
version.json: { "version": "1.0" }

# Primo deploy
$ npm run version:increment
📦 Versione corrente: 1.0
✅ Versione aggiornata: 1.1

# Dopo 8 deploy...
version.json: { "version": "1.9" }

# Nono deploy (raggiunge limite)
$ npm run version:increment
📦 Versione corrente: 1.9
✅ Versione aggiornata: 2.0  # X incrementato, Y resettato

# Continua normalmente
$ npm run version:increment
📦 Versione corrente: 2.0
✅ Versione aggiornata: 2.1
```

## 🎨 Visualizzazione

La versione appare nel menu laterale in alto:
```
┌──────────────────┐
│ [Logo] LUM v1.0  │  ← Qui appare la versione
└──────────────────┘
```

Stile:
- Colore: Bianco con opacità 70%
- Dimensione: Testo piccolo (xs)
- Posizione: Accanto a "LUM"

## 🔧 Configurazione Script NPM

Nel `package.json`:

```json
{
  "scripts": {
    "version:increment": "node increment-version.js",
    "predeploy": "npm run version:increment && npm run build",
    "deploy": "npm run export && firebase deploy"
  }
}
```

## ⚠️ Note Importanti

1. **Non modificare manualmente** `version.json` durante i deploy
2. Lo script aggiorna **automaticamente** sia `version.json` che `package.json`
3. La versione è visibile solo dopo il login nell'interfaccia
4. Il file `version.json` deve essere **committato** nel repository
5. Ogni deploy incrementa la versione **automaticamente**

## 🐛 Troubleshooting

### La versione non si aggiorna
```bash
# Verifica che il file esista
ls version.json

# Esegui manualmente lo script
node increment-version.js

# Ricompila il progetto
npm run build
```

### Errore import JSON
Verifica che `tsconfig.json` abbia:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

### Versione non visibile nel browser
1. Pulisci la cache del browser
2. Ricompila: `npm run build`
3. Verifica che il file `version.json` sia nella build

## 📝 Changelog

### v1.0 (2026-01-15)
- ✅ Implementato sistema di versioning automatico
- ✅ Aggiunta visualizzazione versione nel menu
- ✅ Script di incremento automatico
- ✅ Integrazione con deploy process

## 🔄 Workflow Completo

```bash
# 1. Sviluppo locale
npm run dev

# 2. Test
npm run build

# 3. Deploy in produzione (incrementa automaticamente la versione)
npm run deploy

# Output atteso:
# 📦 Versione corrente: 1.0
# ✅ Versione aggiornata: 1.1
# ✓ Compiled successfully
# ✓ Deploy complete!
```

## 📚 Riferimenti

- File versione: `/version.json`
- Modulo version: `/src/lib/version.ts`
- Script increment: `/increment-version.js`
- Visualizzazione: `/src/components/Dashboard.tsx`
