import { useCallback, useState } from 'react';

interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: {
    email: string;
    name: string;
    picture: string;
  } | null;
}

export const useGoogleAuth = () => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inizializza l'autenticazione con Google
  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        throw new Error('Configurazione Google OAuth incompleta');
      }

      // Costruisce l'URL di autenticazione Google OAuth2
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Apre finestra popup per l'autenticazione
      const popup = window.open(
        authUrl, 
        'googleAuth', 
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Impossibile aprire la finestra di autenticazione. Controlla il blocco popup.');
      }

      // Monitora la finestra popup per il callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          setError('Autenticazione annullata dall\'utente');
        }
      }, 1000);

      // Gestisce il messaggio dal popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          handleAuthSuccess(event.data.code);
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          setError(event.data.error);
          setIsLoading(false);
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'autenticazione');
      setIsLoading(false);
    }
  }, []);

  // Gestisce il successo dell'autenticazione
  const handleAuthSuccess = async (code: string) => {
    try {
      // Scambia il codice direttamente con Google OAuth2
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: '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',
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new Error('Errore durante lo scambio del codice di autorizzazione');
      }

      const tokenData = await tokenResponse.json();

      // Ottieni informazioni utente
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Errore durante il recupero informazioni utente');
      }

      const userData = await userResponse.json();
      
      setAuthState({
        isAuthenticated: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        user: {
          email: userData.email,
          name: userData.name,
          picture: userData.picture
        }
      });

      // Salva i token in localStorage per persistenza
      localStorage.setItem('google_auth', JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        user: userData
      }));

    } catch (err) {
      console.error('Auth success handler error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio dei token');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const signOut = useCallback(async () => {
    try {
      // Revoca i token su Google
      if (authState.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${authState.accessToken}`, {
          method: 'POST'
        });
      }

      // Reset stato locale
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null
      });

      // Rimuovi da localStorage
      localStorage.removeItem('google_auth');

    } catch (err) {
      console.error('Errore durante il logout:', err);
      // Reset locale anche in caso di errore
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null
      });
      localStorage.removeItem('google_auth');
    }
  }, [authState.accessToken]);

  // Refresh token
  const refreshAccessToken = useCallback(async () => {
    if (!authState.refreshToken) {
      throw new Error('Nessun refresh token disponibile');
    }

    try {
      // Rinnova il token direttamente con Google OAuth2
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: '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',
          refresh_token: authState.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh error:', errorText);
        throw new Error('Impossibile rinnovare il token di accesso');
      }

      const data = await response.json();
      
      const newAuthState = {
        ...authState,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      };

      setAuthState(newAuthState);

      // Aggiorna localStorage
      localStorage.setItem('google_auth', JSON.stringify({
        accessToken: data.access_token,
        refreshToken: authState.refreshToken,
        expiresAt: newAuthState.expiresAt,
        user: authState.user
      }));

      return data.access_token;

    } catch (err) {
      console.error('Refresh token error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il refresh del token');
      throw err;
    }
  }, [authState]);

  // Ottieni token valido (con refresh automatico)
  const getValidAccessToken = useCallback(async () => {
    if (!authState.isAuthenticated) {
      throw new Error('Utente non autenticato');
    }

    // Controlla se il token è ancora valido (con margine di 5 minuti)
    if (authState.expiresAt && authState.expiresAt > Date.now() + (5 * 60 * 1000)) {
      return authState.accessToken;
    }

    // Token scaduto o prossimo alla scadenza, prova il refresh
    return await refreshAccessToken();
  }, [authState, refreshAccessToken]);

  // Inizializza dall'localStorage all'avvio
  const initializeFromStorage = useCallback(() => {
    const stored = localStorage.getItem('google_auth');
    if (stored) {
      try {
        const parsedAuth = JSON.parse(stored);
        
        // Controlla se il token è ancora valido
        if (parsedAuth.expiresAt > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            accessToken: parsedAuth.accessToken,
            refreshToken: parsedAuth.refreshToken,
            expiresAt: parsedAuth.expiresAt,
            user: parsedAuth.user
          });
        } else {
          // Token scaduto, rimuovi dal storage
          localStorage.removeItem('google_auth');
        }
      } catch (err) {
        console.error('Errore nel parsing dei dati di autenticazione:', err);
        localStorage.removeItem('google_auth');
      }
    }
  }, []);

  return {
    ...authState,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    refreshAccessToken,
    getValidAccessToken,
    initializeFromStorage
  };
};

export default useGoogleAuth;