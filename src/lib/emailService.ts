/**
 * Email Service - Client-side library per l'invio email tramite Firebase Cloud Functions
 * 
 * Questo modulo fornisce un'interfaccia semplice per:
 * - Inviare email tramite Gmail (via Cloud Function)
 * - Testare la connessione email
 * - Gestire la configurazione email (admin)
 * - Consultare i log delle email inviate
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Inizializza Firebase Functions
const functions = getFunctions(getApp(), 'us-central1');

// In development, connetti all'emulatore
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Decommentare per usare l'emulatore locale:
    // connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (e) {
    // Ignora se già connesso
  }
}

// ============================================================
// TIPI
// ============================================================

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConfig {
  configured: boolean;
  email?: string;
  senderName?: string;
  hasPassword?: boolean;
  updatedAt?: Date;
}

export interface EmailConfigInput {
  email: string;
  appPassword: string;
  senderName?: string;
}

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  status: 'sent' | 'error';
  type?: string;
  messageId?: string;
  error?: string;
  sentAt: Date;
  sentBy: string;
  scadenzaId?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  senderName?: string;
}

// ============================================================
// FUNZIONI PRINCIPALI
// ============================================================

/**
 * Invia un'email tramite la Cloud Function
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const sendEmailFn = httpsCallable(functions, 'sendEmail');
    const result = await sendEmailFn(params);
    return result.data as SendEmailResult;
  } catch (error: any) {
    console.error('Errore invio email:', error);
    return {
      success: false,
      error: error.message || 'Errore sconosciuto nell\'invio email',
    };
  }
}

/**
 * Testa la connessione al server email
 */
export async function testEmailConnection(): Promise<TestConnectionResult> {
  try {
    const testFn = httpsCallable(functions, 'testEmailConnection');
    const result = await testFn({});
    return result.data as TestConnectionResult;
  } catch (error: any) {
    console.error('Errore test connessione:', error);
    return {
      success: false,
      message: error.message || 'Errore nel test della connessione',
    };
  }
}

/**
 * Salva la configurazione email (solo admin)
 */
export async function saveEmailConfig(config: EmailConfigInput): Promise<{ success: boolean; message: string }> {
  try {
    const saveFn = httpsCallable(functions, 'saveEmailConfig');
    const result = await saveFn(config);
    return result.data as { success: boolean; message: string };
  } catch (error: any) {
    console.error('Errore salvataggio config:', error);
    return {
      success: false,
      message: error.message || 'Errore nel salvataggio della configurazione',
    };
  }
}

/**
 * Recupera la configurazione email corrente (solo admin)
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const getFn = httpsCallable(functions, 'getEmailConfig');
    const result = await getFn({});
    return result.data as EmailConfig;
  } catch (error: any) {
    console.error('Errore lettura config:', error);
    return { configured: false };
  }
}

/**
 * Recupera i log delle email inviate
 */
export async function getEmailLogs(maxResults: number = 50): Promise<EmailLog[]> {
  try {
    const q = query(
      collection(db, 'emailLogs'),
      orderBy('sentAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        to: data.to || [],
        subject: data.subject || '',
        status: data.status || 'error',
        type: data.type,
        messageId: data.messageId,
        error: data.error,
        sentAt: data.sentAt ? data.sentAt.toDate() : new Date(),
        sentBy: data.sentBy || '',
        scadenzaId: data.scadenzaId,
      } as EmailLog;
    });
  } catch (error) {
    console.error('Errore lettura log email:', error);
    return [];
  }
}

/**
 * Invia email di promemoria scadenza manualmente
 */
export async function sendScadenzaReminder(scadenza: {
  titolo: string;
  descrizione?: string;
  categoria: string;
  dataScadenza: Date;
  importo?: number;
  priorita: string;
  emails: string[];
}): Promise<SendEmailResult> {
  const dataScadenza = scadenza.dataScadenza;
  const now = new Date();
  const giorniRimasti = Math.ceil((dataScadenza.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const prioritaColors: Record<string, string> = {
    bassa: '#4CAF50',
    media: '#FF9800',
    alta: '#f44336',
    critica: '#9C27B0',
  };

  const categoriaLabels: Record<string, string> = {
    tributi: '💰 Tributi',
    bollette: '📄 Bollette',
    manutenzione: '🔧 Manutenzione',
    documenti: '📋 Documenti',
  };

  const html = `
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
                ${giorniRimasti <= 0 ? 'SCADUTA!' : giorniRimasti + ' giorni'}
              </span>
            </td>
          </tr>
          ${scadenza.importo ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #666;">Importo:</td>
            <td style="padding: 8px;">€ ${scadenza.importo.toFixed(2)}</td>
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
        <p>Questa email è stata inviata da LyfeUmbria</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: scadenza.emails.filter(e => e && e.trim()),
    subject: `${giorniRimasti <= 0 ? '🚨 SCADUTA' : '⏰ Promemoria'}: ${scadenza.titolo} - ${dataScadenza.toLocaleDateString('it-IT')}`,
    html,
  });
}

export interface BulkReminderResult {
  sent: number;
  skipped: number;
  errors: number;
  details: Array<{ titolo: string; status: 'sent' | 'skipped' | 'error'; reason?: string }>;
}

/**
 * Invia promemoria per tutte le scadenze imminenti nei prossimi `giorni` giorni
 * che hanno almeno un indirizzo email configurato.
 */
export async function sendAllScadenzeReminders(
  scadenze: Array<{
    titolo: string;
    descrizione?: string;
    categoria: string;
    dataScadenza: Date;
    importo?: number;
    priorita: string;
    emails: string[];
    completata: boolean;
  }>,
  giorni: number = 7,
): Promise<BulkReminderResult> {
  const now = new Date();
  const limit = new Date(now.getTime() + giorni * 24 * 60 * 60 * 1000);

  const result: BulkReminderResult = { sent: 0, skipped: 0, errors: 0, details: [] };

  const candidates = scadenze.filter((s) => {
    if (s.completata) return false;
    const ds = s.dataScadenza;
    return ds >= now && ds <= limit;
  });

  for (const s of candidates) {
    const validEmails = (s.emails ?? []).filter((e) => e && e.trim());
    if (validEmails.length === 0) {
      result.skipped++;
      result.details.push({ titolo: s.titolo, status: 'skipped', reason: 'Nessun indirizzo email configurato' });
      continue;
    }
    try {
      await sendScadenzaReminder({ ...s, emails: validEmails });
      result.sent++;
      result.details.push({ titolo: s.titolo, status: 'sent' });
    } catch (err: any) {
      result.errors++;
      result.details.push({ titolo: s.titolo, status: 'error', reason: err?.message ?? 'Errore sconosciuto' });
    }
  }

  return result;
}
