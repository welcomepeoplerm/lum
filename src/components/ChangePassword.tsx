'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, Mail, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ChangePasswordProps {
  onClose: () => void;
}

const ChangePassword = ({ onClose }: ChangePasswordProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [step, setStep] = useState<'form' | 'email-sent'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      setMessage({ type: 'error', text: 'Errore: utente non autenticato' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: 'Invio email in corso...' });

    try {
      console.log('Tentativo di invio email di reset a:', user.email);
      
      // Invia email di reset password tramite Firebase
      await sendPasswordResetEmail(auth, user.email, {
        url: `${window.location.origin}/login`, // URL di ritorno dopo il reset
        handleCodeInApp: false
      });

      console.log('Email di reset inviata con successo a:', user.email);
      
      setStep('email-sent');
      setMessage({ 
        type: 'success', 
        text: `È stata inviata un'email di reset password a ${user.email}. Controlla anche la cartella spam se non la ricevi entro 5 minuti.` 
      });

    } catch (error: any) {
      console.error('Errore dettagliato nel cambio password:', error);
      console.error('Codice errore:', error.code);
      console.error('Messaggio errore:', error.message);
      
      let errorMessage = 'Errore durante l\'invio dell\'email di reset';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Utente non trovato nel sistema';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email non valida';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Troppe richieste. Attendi qualche minuto e riprova';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Errore di connessione. Controlla la tua connessione internet';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account utente disabilitato';
          break;
        case 'auth/invalid-continue-uri':
          errorMessage = 'URL di continuazione non valido';
          break;
        case 'auth/unauthorized-continue-uri':
          errorMessage = 'URL di continuazione non autorizzato';
          break;
        default:
          errorMessage = `Errore: ${error.message || 'Errore sconosciuto durante l\'invio dell\'email'}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });
      setMessage({ type: 'success', text: 'Email di reset password inviata nuovamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore nell\'invio dell\'email' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Lock className="h-6 w-6 mr-3" style={{color: '#8d9c71'}} />
            <h2 className="text-xl font-semibold" style={{color: '#46433c'}}>
              Cambia Password
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Per sicurezza, ti invieremo un'email di conferma per completare il cambio password.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium mb-1">Come funziona:</p>
                      <ol className="text-blue-700 space-y-1 list-decimal list-inside text-xs">
                        <li>Clicca su "Invia Email di Reset"</li>
                        <li>Controlla la tua casella email</li>
                        <li>Clicca sul link nell'email ricevuta</li>
                        <li>Imposta la tua nuova password</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Account
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    L'email di reset sarà inviata a questo indirizzo. 
                    <br />
                    <strong>Importante:</strong> Controlla anche la cartella spam/posta indesiderata!
                  </p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">📧 Troubleshooting Email:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>L'email può impiegare 2-10 minuti ad arrivare</li>
                      <li>Controlla la cartella <strong>spam/posta indesiderata</strong></li>
                      <li>Verifica che l'email sia corretta: <code className="bg-white px-1 rounded">{user?.email}</code></li>
                      <li>Se non arriva, riprova tra qualche minuto</li>
                    </ul>
                  </div>
                </div>

                {message && (
                  <div className={`flex items-center p-3 rounded-md text-sm ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'  
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {message.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    {message.text}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    style={{backgroundColor: '#8d9c71'}}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Invio...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Invia Email di Reset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'email-sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#f0f9ff'}}>
                <Mail className="h-8 w-8" style={{color: '#0369a1'}} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Email Inviata!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Abbiamo inviato un'email di reset password a:
                </p>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                  {user?.email}
                </p>
              </div>

              {message && (
                <div className={`flex items-center p-3 rounded-md text-sm ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'  
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Prossimi passi:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Controlla la tua casella email (anche lo spam)</li>
                    <li>Clicca sul link "Reset Password" nell'email</li>
                    <li>Inserisci e conferma la tua nuova password</li>
                    <li>Accedi con la nuova password</li>
                  </ol>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Invio...' : 'Invia di nuovo'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                  style={{backgroundColor: '#8d9c71'}}
                >
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;