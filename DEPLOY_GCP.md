# Deploy su Google Cloud Platform

Guida completa per il deploy dell'applicazione LyfeUmbria Manager su Google Cloud Platform.

## 📋 Prerequisiti

1. Account Google Cloud Platform attivo
2. Progetto Firebase configurato
3. `gcloud CLI` installato e configurato
4. Docker installato (per Cloud Run)

## 🚀 Opzioni di Deploy

### Opzione 1: Firebase Hosting (Consigliata per Static Export)

```bash
# 1. Installa Firebase CLI
npm install -g firebase-tools

# 2. Login a Firebase
firebase login

# 3. Inizializza il progetto
firebase init hosting

# 4. Configura next.config.ts per export statico
# Aggiungi: output: 'export'

# 5. Build e deploy
npm run build
firebase deploy
```

### Opzione 2: Cloud Run (Full-Stack con SSR)

```bash
# 1. Crea Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
EOF

# 2. Build e deploy su Cloud Run
gcloud run deploy casale-manager \\
  --source . \\
  --platform managed \\
  --region europe-west1 \\
  --allow-unauthenticated
```

### Opzione 3: App Engine

```bash
# 1. Crea app.yaml
cat > app.yaml << EOF
runtime: nodejs18
env_variables:
  NEXT_PUBLIC_FIREBASE_API_KEY: "your_api_key"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your_project.firebaseapp.com"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your_project_id"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "your_project.appspot.com"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "your_sender_id"
  NEXT_PUBLIC_FIREBASE_APP_ID: "your_app_id"
EOF

# 2. Deploy
gcloud app deploy
```

## ⚙️ Configurazione Produzione

### 1. Variabili d'Ambiente

Per Cloud Run e App Engine, configura le variabili d'ambiente:

```bash
gcloud run services update casale-manager \\
  --region=europe-west1 \\
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your_key,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain"
```

### 2. Dominio Personalizzato

```bash
# Cloud Run
gcloud run domain-mappings create \\
  --service casale-manager \\
  --domain casale.tuodominio.com \\
  --region europe-west1

# App Engine
gcloud app domain-mappings create casale.tuodominio.com
```

### 3. SSL Certificate

I certificati SSL vengono gestiti automaticamente da GCP per domini personalizzati.

## 🔧 Ottimizzazioni

### Performance

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
```

### Sicurezza

```typescript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
};
```

## 📊 Monitoraggio

### Cloud Logging

```bash
# Visualizza logs in tempo reale
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=casale-manager"
```

### Cloud Monitoring

1. Vai alla Console GCP > Monitoring
2. Crea dashboard personalizzati
3. Configura alert per errori e latenza

## 💰 Stima Costi

### Firebase (Spark Plan - Gratuito)
- 1GB storage Firestore
- 50K letture/giorno
- 20K scritture/giorno
- 10GB trasferimento

### Cloud Run
- €0.40 per milione di richieste
- €0.24 per GB-ora di RAM
- €0.09 per vCPU-ora

### Traffico Stimato (100 utenti attivi)
- ~€5-10/mese per piccolo casale
- ~€20-40/mese per casale con alto traffico

## 🚨 Troubleshooting

### Errore Build
```bash
# Verifica localmente
npm run build
npm start
```

### Errore Firebase
```bash
# Controlla regole Firestore
# Verifica variabili d'ambiente
# Controlla quota Firebase
```

### Errore SSL
```bash
# Controlla DNS
# Verifica mapping dominio
# Attendi propagazione (24-48h)
```

## 📱 CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GCP
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v0
      with:
        project_id: ${{ secrets.GCP_PROJECT }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        
    - name: Deploy to Cloud Run
      run: gcloud run deploy casale-manager --source .
```

---

*Questa guida copre le configurazioni più comuni. Per setup avanzati, consulta la documentazione ufficiale GCP.*