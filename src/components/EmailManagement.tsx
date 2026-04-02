'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Settings, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  History,
  TestTube,
  Save
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  sendEmail,
  testEmailConnection,
  saveEmailConfig,
  getEmailConfig,
  getEmailLogs,
  EmailConfig,
  EmailLog,
} from '../lib/emailService';

type TabType = 'config' | 'test' | 'logs';

export default function EmailManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('config');

  // Config state
  const [config, setConfig] = useState<EmailConfig>({ configured: false });
  const [configForm, setConfigForm] = useState({
    email: '',
    appPassword: '',
    senderName: 'LyfeUmbria',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test state
  const [testForm, setTestForm] = useState({
    to: '',
    subject: 'Test Email - LyfeUmbria',
    body: 'Questa è un\'email di test inviata da LyfeUmbria. Se la ricevi, la configurazione è corretta! ✅',
  });
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connection test state
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'error'>('unknown');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Logs state
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Carica configurazione iniziale
  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const cfg = await getEmailConfig();
      setConfig(cfg);
      if (cfg.email) {
        setConfigForm(prev => ({
          ...prev,
          email: cfg.email || '',
          senderName: cfg.senderName || 'LyfeUmbria',
        }));
      }
    } catch {
      console.error('Errore caricamento config email');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const emailLogs = await getEmailLogs(50);
      setLogs(emailLogs);
    } catch {
      console.error('Errore caricamento log');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadConfig();
    }
  }, [user, loadConfig]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  // Salva configurazione
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const result = await saveEmailConfig({
        email: configForm.email,
        appPassword: configForm.appPassword,
        senderName: configForm.senderName,
      });

      if (result.success) {
        setConfigMessage({ type: 'success', text: 'Configurazione salvata con successo!' });
        setConfigForm(prev => ({ ...prev, appPassword: '' }));
        await loadConfig();
      } else {
        setConfigMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setConfigMessage({ type: 'error', text: error.message || 'Errore nel salvataggio' });
    } finally {
      setConfigSaving(false);
    }
  };

  // Test connessione
  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      const result = await testEmailConnection();
      if (result.success) {
        setConnectionStatus('connected');
        setConnectionMessage(result.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMessage(error.message || 'Errore nel test');
    }
  };

  // Invio email di test
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestResult(null);

    try {
      const result = await sendEmail({
        to: testForm.to,
        subject: testForm.subject,
        body: testForm.body,
      });

      if (result.success) {
        setTestResult({ type: 'success', text: `Email inviata con successo! ID: ${result.messageId}` });
      } else {
        setTestResult({ type: 'error', text: result.error || 'Errore nell\'invio' });
      }
    } catch (error: any) {
      setTestResult({ type: 'error', text: error.message || 'Errore nell\'invio dell\'email' });
    } finally {
      setTestSending(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-yellow-700 font-medium">Solo gli amministratori possono gestire le email.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'config' as TabType, label: 'Configurazione', icon: Settings },
    { key: 'test' as TabType, label: 'Invio Test', icon: TestTube },
    { key: 'logs' as TabType, label: 'Log Invii', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={activeTab === tab.key ? { backgroundColor: '#2f5fdd', borderBottomColor: '#6b7a54' } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB: Configurazione */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Status attuale */}
              <div className={`p-4 rounded-lg border ${
                config.configured 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {config.configured ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <p className={`font-medium ${config.configured ? 'text-green-800' : 'text-yellow-800'}`}>
                      {config.configured 
                        ? `Email configurata: ${config.email}` 
                        : 'Email non configurata'}
                    </p>
                    {config.configured && config.senderName && (
                      <p className="text-sm text-green-600">Nome mittente: {config.senderName}</p>
                    )}
                  </div>
                </div>
                
                {config.configured && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={connectionStatus === 'testing'}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {connectionStatus === 'testing' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : connectionStatus === 'connected' ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : connectionStatus === 'error' ? (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      ) : (
                        <Wifi className="w-4 h-4" />
                      )}
                      Test Connessione
                    </button>
                    {connectionMessage && (
                      <span className={`text-sm self-center ${
                        connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {connectionMessage}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Form configurazione */}
              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Caricamento configurazione...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">ℹ️ Come configurare Gmail</h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Vai su <strong>myaccount.google.com</strong> → Sicurezza</li>
                      <li>Attiva la <strong>Verifica in 2 passaggi</strong> (se non già attiva)</li>
                      <li>Cerca <strong>&quot;Password per le app&quot;</strong> nella barra di ricerca</li>
                      <li>Crea una nuova App Password per &quot;LyfeUmbria&quot;</li>
                      <li>Copia la password generata (16 caratteri) e incollala qui sotto</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Gmail
                    </label>
                    <input
                      type="email"
                      value={configForm.email}
                      onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                      placeholder="tuoemail@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Password Google
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={configForm.appPassword}
                        onChange={(e) => setConfigForm({ ...configForm, appPassword: e.target.value })}
                        placeholder={config.hasPassword ? '••••••••••••••••  (già impostata)' : 'Inserisci la App Password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required={!config.hasPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      La App Password è diversa dalla password del tuo account Google.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Mittente
                    </label>
                    <input
                      type="text"
                      value={configForm.senderName}
                      onChange={(e) => setConfigForm({ ...configForm, senderName: e.target.value })}
                      placeholder="LyfeUmbria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Il nome che apparirà come mittente nelle email.
                    </p>
                  </div>

                  {configMessage && (
                    <div className={`p-3 rounded-md flex items-center gap-2 ${
                      configMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {configMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{configMessage.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={configSaving}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#2f5fdd' }}
                  >
                    {configSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salva Configurazione
                  </button>
                </form>
              )}

              {/* Limiti Gmail */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">📊 Limiti Gmail gratuito</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>500 email/giorno</strong> per account Gmail personale</li>
                  <li>• <strong>2.000 email/giorno</strong> per Google Workspace</li>
                  <li>• Max <strong>500 destinatari</strong> per singola email</li>
                  <li>• Allegati fino a <strong>25 MB</strong></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: Invio Test */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              {!config.configured && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-700 font-medium">
                      Configura prima l&apos;email nella tab &quot;Configurazione&quot;
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendTest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                  </label>
                  <input
                    type="email"
                    value={testForm.to}
                    onChange={(e) => setTestForm({ ...testForm, to: e.target.value })}
                    placeholder="destinatario@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto
                  </label>
                  <input
                    type="text"
                    value={testForm.subject}
                    onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio
                  </label>
                  <textarea
                    value={testForm.body}
                    onChange={(e) => setTestForm({ ...testForm, body: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {testResult && (
                  <div className={`p-3 rounded-md flex items-center gap-2 ${
                    testResult.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testResult.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{testResult.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={testSending || !config.configured}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2f5fdd' }}
                >
                  {testSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Invia Email di Test
                </button>
              </form>
            </div>
          )}

          {/* TAB: Log Invii */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">Storico Email Inviate</h3>
                <button
                  onClick={loadLogs}
                  disabled={logsLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </button>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nessuna email inviata ancora.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Stato</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Destinatari</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Oggetto</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            {log.status === 'sent' ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Inviata
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600" title={log.error}>
                                <XCircle className="w-4 h-4" />
                                Errore
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {log.sentAt.toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2 px-3 text-gray-600 max-w-[200px] truncate">
                            {log.to.join(', ')}
                          </td>
                          <td className="py-2 px-3 text-gray-800 max-w-[250px] truncate">
                            {log.subject}
                          </td>
                          <td className="py-2 px-3">
                            {log.type === 'scadenza_notification' ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                Scadenza
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Manuale
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
