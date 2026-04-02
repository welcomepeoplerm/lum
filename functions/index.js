const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();
const db = getFirestore();

// ============================================================
// CONFIGURAZIONE EMAIL
// ============================================================
// Le credenziali Gmail vengono lette da Firestore (configurabile da UI admin)
// oppure da variabili d'ambiente:
//   GMAIL_EMAIL, GMAIL_PASSWORD, GMAIL_SENDER_NAME
//
// NOTA: "password" è una App Password di Google, NON la password dell'account.
// Per generarla: Google Account → Sicurezza → Verifica in 2 passaggi → Password per le app
// ============================================================

/**
 * Crea un transporter Nodemailer per Gmail.
 * Legge le credenziali da:
 * 1. Variabili d'ambiente (produzione)
 * 2. Firestore collection 'emailConfig' (fallback configurabile da UI)
 */
async function getTransporter() {
  let email, password, senderName;

  // Prova prima da variabili d'ambiente
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_PASSWORD) {
    email = process.env.GMAIL_EMAIL;
    password = process.env.GMAIL_PASSWORD;
    senderName = process.env.GMAIL_SENDER_NAME || 'LyfeUmbria';
  }

  // Fallback: leggi da Firestore (configurabile da UI admin)
  if (!email || !password) {
    try {
      const configDoc = await db.collection('emailConfig').doc('gmail').get();
      if (configDoc.exists) {
        const data = configDoc.data();
        email = data.email;
        password = data.appPassword;
        senderName = data.senderName || 'LyfeUmbria';
      }
    } catch (e) {
      console.error('Errore lettura config email da Firestore:', e);
    }
  }

  if (!email || !password) {
    throw new Error(
      'Configurazione email mancante. Impostare tramite variabili d\'ambiente o dalla UI admin.'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password,
    },
  });

  return { transporter, email, senderName };
}

// ============================================================
// CLOUD FUNCTION: Invio Email (v2 onCall)
// ============================================================
exports.sendEmail = onCall({ cors: true }, async (request) => {
  // Verifica autenticazione
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Devi essere autenticato per inviare email.'
    );
  }

  const { to, subject, body, html, cc, bcc } = request.data;

  // Validazione parametri
  if (!to || !subject || (!body && !html)) {
    throw new HttpsError(
      'invalid-argument',
      'Parametri mancanti: to, subject, e body/html sono obbligatori.'
    );
  }

  // Validazione array di destinatari
  const recipients = Array.isArray(to) ? to : [to];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const addr of recipients) {
    if (!emailRegex.test(addr)) {
      throw new HttpsError(
        'invalid-argument',
        `Indirizzo email non valido: ${addr}`
      );
    }
  }

  try {
    const { transporter, email, senderName } = await getTransporter();

    const mailOptions = {
      from: `"${senderName}" <${email}>`,
      to: recipients.join(', '),
      subject: subject,
      ...(html ? { html: html } : { text: body }),
      ...(cc && { cc: Array.isArray(cc) ? cc.join(', ') : cc }),
      ...(bcc && { bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc }),
    };

    const info = await transporter.sendMail(mailOptions);

    // Log invio su Firestore
    await db.collection('emailLogs').add({
      to: recipients,
      subject: subject,
      status: 'sent',
      messageId: info.messageId,
      sentAt: FieldValue.serverTimestamp(),
      sentBy: request.auth.uid,
    });

    console.log('Email inviata:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Errore invio email:', error);

    // Log errore su Firestore
    await db.collection('emailLogs').add({
      to: recipients,
      subject: subject,
      status: 'error',
      error: error.message,
      sentAt: FieldValue.serverTimestamp(),
      sentBy: request.auth.uid,
    });

    throw new HttpsError(
      'internal',
      `Errore nell'invio dell'email: ${error.message}`
    );
  }
});

// ============================================================
// CLOUD FUNCTION: Test connessione email (v2 onCall)
// ============================================================
exports.testEmailConnection = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Devi essere autenticato.'
    );
  }

  try {
    const { transporter, email, senderName } = await getTransporter();
    await transporter.verify();
    return { 
      success: true, 
      message: `Connessione Gmail verificata per ${email}`,
      senderName: senderName 
    };
  } catch (error) {
    throw new HttpsError(
      'internal',
      `Errore verifica connessione: ${error.message}`
    );
  }
});

// ============================================================
// CLOUD FUNCTION: Salva configurazione email (solo admin, v2 onCall)
// ============================================================
exports.saveEmailConfig = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Devi essere autenticato.'
    );
  }

  // Verifica ruolo admin da Firestore
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Solo gli amministratori possono configurare le email.'
    );
  }

  const { email, appPassword, senderName } = request.data;

  if (!email || !appPassword) {
    throw new HttpsError(
      'invalid-argument',
      'Email e App Password sono obbligatori.'
    );
  }

  try {
    await db.collection('emailConfig').doc('gmail').set({
      email: email,
      appPassword: appPassword,
      senderName: senderName || 'LyfeUmbria',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid,
    });

    return { success: true, message: 'Configurazione email salvata.' };
  } catch (error) {
    throw new HttpsError(
      'internal',
      `Errore nel salvataggio: ${error.message}`
    );
  }
});

// ============================================================
// CLOUD FUNCTION: Leggi configurazione email (solo admin, senza password)
// ============================================================
exports.getEmailConfig = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Devi essere autenticato.'
    );
  }

  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Solo gli amministratori possono vedere la configurazione email.'
    );
  }

  try {
    const configDoc = await db.collection('emailConfig').doc('gmail').get();
    if (!configDoc.exists) {
      return { configured: false };
    }

    const configData = configDoc.data();
    return {
      configured: true,
      email: configData.email,
      senderName: configData.senderName || 'LyfeUmbria',
      hasPassword: !!configData.appPassword,
      updatedAt: configData.updatedAt,
    };
  } catch (error) {
    throw new HttpsError(
      'internal',
      `Errore lettura configurazione: ${error.message}`
    );
  }
});

// ============================================================
// CLOUD FUNCTION: Controlla scadenze e invia notifiche
// Schedulata: ogni giorno alle 8:00
// Finestra: 7 giorni (invia 1 promemoria per scadenza per giorno)
// ============================================================
exports.checkScadenzeAndNotify = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'Europe/Rome',
  },
  async (event) => {
    try {
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Data odierna in formato YYYY-MM-DD per deduplicazione
      const todayStr = now.toISOString().split('T')[0];

      // Recupera scadenze non completate nei prossimi 7 giorni
      const scadenzeSnapshot = await db
        .collection('scadenze')
        .where('completata', '==', false)
        .where('dataScadenza', '>=', Timestamp.fromDate(now))
        .where('dataScadenza', '<=', Timestamp.fromDate(inSevenDays))
        .get();

      if (scadenzeSnapshot.empty) {
        console.log('Nessuna scadenza imminente.');
        return;
      }

      // Recupera i log di oggi per evitare duplicati
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const todayLogsSnap = await db
        .collection('emailLogs')
        .where('sentAt', '>=', Timestamp.fromDate(todayStart))
        .where('sentAt', '<', Timestamp.fromDate(todayEnd))
        .where('type', '==', 'scadenza_notification')
        .get();
      const alreadySentToday = new Set(todayLogsSnap.docs.map(d => d.data().scadenzaId).filter(Boolean));

      const { transporter, email, senderName } = await getTransporter();

      for (const doc of scadenzeSnapshot.docs) {
        // Salta se già notificato oggi
        if (alreadySentToday.has(doc.id)) {
          console.log(`Già notificato oggi: ${doc.data().titolo}`);
          continue;
        }

        const scadenza = doc.data();
        const dataScadenza = scadenza.dataScadenza.toDate();
        const giorniRimasti = Math.ceil((dataScadenza - now) / (1000 * 60 * 60 * 24));

        if (giorniRimasti < 1 || giorniRimasti > 7) continue;

        // Determina destinatari
        const destinatari = scadenza.emails && scadenza.emails.length > 0 
          ? scadenza.emails.filter(e => e && e.trim()) 
          : [];

        if (destinatari.length === 0) continue;

        const prioritaColors = {
          bassa: '#4CAF50',
          media: '#FF9800',
          alta: '#f44336',
          critica: '#9C27B0',
        };

        const categoriaLabels = {
          tributi: '💰 Tributi',
          bollette: '📄 Bollette',
          manutenzione: '🔧 Manutenzione',
          documenti: '📋 Documenti',
        };

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #8d9c71; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">⏰ Promemoria Scadenza</h1>
              <p style="margin: 5px 0 0 0;">LyfeUmbria - Gestione Casale</p>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2 style="color: #333;">${scadenza.titolo}</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #666;">Categoria:</td>
                  <td style="padding: 8px;">${categoriaLabels[scadenza.categoria] || scadenza.categoria}</td>
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
                ${scadenza.importo ? `
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #666;">Importo:</td>
                  <td style="padding: 8px;">€ ${Number(scadenza.importo).toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #666;">Priorità:</td>
                  <td style="padding: 8px;">
                    <span style="background-color: ${prioritaColors[scadenza.priorita] || '#999'}; color: white; padding: 2px 8px; border-radius: 12px;">
                      ${scadenza.priorita.toUpperCase()}
                    </span>
                  </td>
                </tr>
                ${scadenza.descrizione ? `
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #666;">Descrizione:</td>
                  <td style="padding: 8px;">${scadenza.descrizione}</td>
                </tr>` : ''}
              </table>
            </div>
            <div style="background-color: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
              <p>Questa email è stata inviata automaticamente da LyfeUmbria</p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"${senderName}" <${email}>`,
            to: destinatari.join(', '),
            subject: `⏰ Promemoria (${giorniRimasti}g): ${scadenza.titolo} - ${dataScadenza.toLocaleDateString('it-IT')}`,
            html: htmlContent,
          });

          await db.collection('emailLogs').add({
            to: destinatari,
            subject: `Promemoria: ${scadenza.titolo}`,
            status: 'sent',
            type: 'scadenza_notification',
            scadenzaId: doc.id,
            sentAt: FieldValue.serverTimestamp(),
            sentBy: 'system',
          });

          console.log(`Notifica inviata per scadenza: ${scadenza.titolo} (${giorniRimasti}g)`);
        } catch (emailError) {
          console.error(`Errore invio notifica per ${scadenza.titolo}:`, emailError);
          await db.collection('emailLogs').add({
            to: destinatari,
            subject: `Promemoria: ${scadenza.titolo}`,
            status: 'error',
            type: 'scadenza_notification',
            error: emailError.message,
            scadenzaId: doc.id,
            sentAt: FieldValue.serverTimestamp(),
            sentBy: 'system',
          });
        }
      }
    } catch (error) {
      console.error('Errore nel check scadenze:', error);
    }
  }
);
