/**
 * Script one-shot: invia email di promemoria per le scadenze imminenti.
 * Uso: node send-reminders-now.js [--giorni=7]
 *
 * Legge le credenziali email da Firestore (collezione emailConfig/gmail),
 * identico a quanto fa la Cloud Function schedulata.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const path = require('path');

// Chiave service account (già presente nel progetto)
const serviceAccount = require('./lyfeumbria-firebase-adminsdk-fbsvc-451e581963.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Legge --giorni=N da argv (default 7)
const giorniArg = process.argv.find(a => a.startsWith('--giorni='));
const GIORNI = giorniArg ? parseInt(giorniArg.split('=')[1]) : 7;

async function getTransporter() {
  const configDoc = await db.collection('emailConfig').doc('gmail').get();
  if (!configDoc.exists) throw new Error('Configurazione email non trovata in Firestore (emailConfig/gmail).');
  const data = configDoc.data();
  if (!data.email || !data.appPassword) throw new Error('Email o App Password mancanti in Firestore.');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: data.email, pass: data.appPassword },
  });
  return { transporter, email: data.email, senderName: data.senderName || 'LyfeUmbria' };
}

async function main() {
  console.log(`\n🔍 Controllo scadenze nei prossimi ${GIORNI} giorni...\n`);

  const now = new Date();
  const limit = new Date(now.getTime() + GIORNI * 24 * 60 * 60 * 1000);

  const snap = await db
    .collection('scadenze')
    .where('completata', '==', false)
    .get();

  // Filtra in memoria per finestra temporale
  const docs = snap.docs.filter(d => {
    const ds = d.data().dataScadenza?.toDate();
    return ds && ds >= now && ds <= limit;
  });

  if (docs.length === 0) {
    console.log('\u2705 Nessuna scadenza imminente trovata.');
    process.exit(0);
  }

  console.log(`\uD83D\uDCCB Trovate ${docs.length} scadenze imminenti:\n`);

  let sent = 0, skipped = 0, errors = 0;

  const { transporter, email: senderEmail, senderName } = await getTransporter();

  const prioritaColors = {
    bassa: '#4CAF50', media: '#FF9800', alta: '#f44336', critica: '#9C27B0',
  };
  const categoriaLabels = {
    tributi: '\uD83D\uDCB0 Tributi', bollette: '\uD83D\uDCC4 Bollette',
    manutenzione: '\uD83D\uDD27 Manutenzione', documenti: '\uD83D\uDCCB Documenti',
  };

  for (const docSnap of docs) {
    const s = docSnap.data();
    const dataScadenza = s.dataScadenza.toDate();
    const giorniRimasti = Math.ceil((dataScadenza - now) / (1000 * 60 * 60 * 24));
    const destinatari = (s.emails || []).filter(e => e && e.trim());

    console.log(`  • ${s.titolo} — scade il ${dataScadenza.toLocaleDateString('it-IT')} (${giorniRimasti}g)`);

    if (destinatari.length === 0) {
      console.log(`    ⚠️  SALTATA: nessun indirizzo email configurato\n`);
      skipped++;
      continue;
    }

    console.log(`    📧 Invio a: ${destinatari.join(', ')}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #8d9c71; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⏰ Promemoria Scadenza</h1>
          <p style="margin: 5px 0 0 0;">LyfeUmbria - Gestione Casale</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333;">${s.titolo}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Categoria:</td>
              <td style="padding: 8px;">${categoriaLabels[s.categoria] || s.categoria}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Data Scadenza:</td>
              <td style="padding: 8px;">${dataScadenza.toLocaleDateString('it-IT')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Giorni rimasti:</td>
              <td style="padding: 8px;">
                <span style="background-color: ${giorniRimasti <= 1 ? '#f44336' : giorniRimasti <= 3 ? '#FF9800' : '#4CAF50'}; color: white; padding: 2px 8px; border-radius: 12px;">
                  ${giorniRimasti} ${giorniRimasti === 1 ? 'giorno' : 'giorni'}
                </span>
              </td>
            </tr>
            ${s.importo ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Importo:</td>
              <td style="padding: 8px;">€ ${Number(s.importo).toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Priorità:</td>
              <td style="padding: 8px;">
                <span style="background-color: ${prioritaColors[s.priorita] || '#999'}; color: white; padding: 2px 8px; border-radius: 12px;">
                  ${s.priorita.toUpperCase()}
                </span>
              </td>
            </tr>
            ${s.descrizione ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #666;">Descrizione:</td>
              <td style="padding: 8px;">${s.descrizione}</td>
            </tr>` : ''}
          </table>
        </div>
        <div style="background-color: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          <p>Questa email è stata inviata manualmente da LyfeUmbria</p>
        </div>
      </div>`;

    try {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: destinatari.join(', '),
        subject: `⏰ Promemoria (${giorniRimasti}g): ${s.titolo} - ${dataScadenza.toLocaleDateString('it-IT')}`,
        html: htmlContent,
      });

      await db.collection('emailLogs').add({
        to: destinatari,
        subject: `Promemoria: ${s.titolo}`,
        status: 'sent',
        type: 'scadenza_notification_manual',
        scadenzaId: docSnap.id,
        messageId: info.messageId,
        sentAt: Timestamp.now(),
        sentBy: 'script',
      });

      console.log(`    ✅ Inviata (${info.messageId})\n`);
      sent++;
    } catch (err) {
      console.error(`    ❌ ERRORE: ${err.message}\n`);
      await db.collection('emailLogs').add({
        to: destinatari,
        subject: `Promemoria: ${s.titolo}`,
        status: 'error',
        type: 'scadenza_notification_manual',
        scadenzaId: docSnap.id,
        error: err.message,
        sentAt: Timestamp.now(),
        sentBy: 'script',
      });
      errors++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`📊 Riepilogo: ✅ Inviate: ${sent}  ⚠️  Saltate: ${skipped}  ❌ Errori: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Errore fatale:', err.message);
  process.exit(1);
});
