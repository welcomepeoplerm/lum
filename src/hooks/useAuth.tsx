'use client';

import { useState, useEffect, useContext, createContext } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          } catch (error) {
            console.error('💥 Error creating user document:', error);
            setUser(null);
          }
        }
      } else {
        console.log('🚪 User logged out');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
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