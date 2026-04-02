'use client';

import { useState, useEffect, useContext, createContext, useRef, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, LoginCredentials, RegisterData } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  showSessionWarning: boolean;
  sessionWarningTimeLeft: number;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Gestione timeout sessione - 10 minuti di inattività
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minuti in millisecondi
  const WARNING_TIME = 2 * 60 * 1000; // Warning 2 minuti prima
  // IMPORTANT: use refs to avoid re-rendering the whole app on every user interaction
  // (on iOS this can break input focus and make taps feel unreliable)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionWarningTimeLeft, setSessionWarningTimeLeft] = useState(0);

  // Gestione scadenza sessione
  const handleSessionExpiry = async () => {
    try {
      setShowSessionWarning(false);
      await signOut(auth);
      setUser(null);
      console.log('🚪 Logout automatico per inattività completato');
    } catch (error) {
      console.error('💥 Errore durante logout automatico:', error);
    }
  };

  const clearSessionTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // Funzione per resettare il timer di inattività
  const resetInactivityTimer = useCallback(() => {
    clearSessionTimers();

    // Nasconde il warning se era attivo (se già false, React evita rerender)
    setShowSessionWarning(false);

    // Timer per il warning (8 minuti - 2 minuti prima della scadenza)
    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);
      setSessionWarningTimeLeft(120); // 2 minuti in secondi
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Timer per la scadenza effettiva (10 minuti)
    inactivityTimerRef.current = setTimeout(() => {
      console.log('🕒 Sessione scaduta per inattività (10 minuti)');
      handleSessionExpiry();
    }, INACTIVITY_TIMEOUT);
  }, [INACTIVITY_TIMEOUT, WARNING_TIME, clearSessionTimers]);

  // Estende la sessione quando l'utente sceglie di continuare
  const extendSession = () => {
    setShowSessionWarning(false);
    resetInactivityTimer();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 Auth state changed:', firebaseUser?.uid);
      if (firebaseUser) {
        console.log('🔥 Firebase user found, fetching Firestore data...');
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        console.log('📄 User doc exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ User data:', userData);
          console.log('📅 createdAt type:', typeof userData.createdAt);
          console.log('📅 createdAt value:', userData.createdAt);
          
          try {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              createdAt: userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
            });
            console.log('✅ User set successfully!');
            // Avvia il timer di inattività quando l'utente è autenticato
            resetInactivityTimer();
          } catch (error) {
            console.error('💥 Error setting user:', error);
          }
        } else {
          console.log('❌ No Firestore document found for user:', firebaseUser.uid);
          console.log('🛠️ Creating user document automatically...');
          
          // Crea automaticamente il documento utente
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              name: 'Nuovo Utente',
              email: firebaseUser.email!,
              role: 'user',
              createdAt: new Date()
            });
            console.log('✅ User document created successfully!');
            
            // Dopo aver creato il documento, imposta l'utente
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: 'Nuovo Utente',
              role: 'user',
              createdAt: new Date()
            });
            // Avvia il timer di inattività
            resetInactivityTimer();
          } catch (error) {
            console.error('💥 Error creating user document:', error);
            setUser(null);
          }
        }
      } else {
        console.log('🚪 User logged out');
        setUser(null);
        // Pulisce i timer quando l'utente si disconnette
        clearSessionTimers();
        setShowSessionWarning(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [clearSessionTimers, resetInactivityTimer]);

  // Effetto per gestire gli eventi di attività dell'utente
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Aggiunge listener per tutti gli eventi di attività
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Cleanup dei listener
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [user]);

  // Cleanup dei timer quando il componente viene smontato
  useEffect(() => {
    return () => {
      clearSessionTimers();
    };
  }, [clearSessionTimers]);

  const login = async (credentials: LoginCredentials) => {
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const register = async (data: RegisterData) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      name: data.name,
      role: data.role || 'user',
      email: data.email,
      createdAt: new Date()
    });
  };

  const logout = async () => {
    // Pulisce i timer prima del logout
    clearSessionTimers();
    setShowSessionWarning(false);
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetInactivityTimer,
    showSessionWarning,
    sessionWarningTimeLeft,
    extendSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}