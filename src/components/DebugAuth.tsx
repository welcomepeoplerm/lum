'use client';

import { useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DebugAuth() {
  useEffect(() => {
    console.log('🚀 DebugAuth component mounted');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state:', user);
      
      if (user) {
        console.log('✅ User logged in:', user.uid, user.email);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('📄 Firestore doc exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            console.log('✅ User data from Firestore:', userDoc.data());
          } else {
            console.log('❌ No user document in Firestore');
          }
        } catch (error) {
          console.error('💥 Firestore error:', error);
        }
      } else {
        console.log('🚪 No user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-red-100 p-4 rounded border">
      <p className="text-sm font-bold">Debug Mode Active</p>
      <p className="text-xs">Check browser console for logs</p>
    </div>
  );
}