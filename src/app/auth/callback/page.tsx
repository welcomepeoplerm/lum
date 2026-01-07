'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log('Auth callback received:', { code: !!code, error }); // Debug log

    if (error) {
      console.error('OAuth error:', error); // Debug log
      // Invia errore al parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin);
    } else if (code) {
      console.log('OAuth success, sending code to parent'); // Debug log
      // Invia codice di successo al parent window
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code: code
      }, window.location.origin);
    } else {
      console.warn('No code or error received in callback'); // Debug log
    }

    // Chiudi la finestra popup
    setTimeout(() => {
      window.close();
    }, 2000); // Aspetta 2 secondi per permettere il debug
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Autenticazione in corso...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            La finestra si chiuderà automaticamente
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}