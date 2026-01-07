import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configurazione Firebase hardcoded per garantire funzionamento in produzione
const firebaseConfig = {
  apiKey: "AIzaSyC4KZ1pAgdUnXrHrb4jmoiQzdONDq0z3iQ",
  authDomain: "lyfeumbria.firebaseapp.com",
  projectId: "lyfeumbria",
  storageBucket: "lyfeumbria.firebasestorage.app",
  messagingSenderId: "627882002142",
  appId: "1:627882002142:web:275d7b23a6ceed9bdbe44f",
  measurementId: "G-GSRHMETH6H"
};

// Debug: verifica configurazione (solo in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', firebaseConfig);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);