'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, RegisterData } from '@/types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Users, UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RegisterData>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: data.createdAt.toDate()
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (data: RegisterData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Usa setDoc con l'ID dell'utente invece di addDoc (che crea un ID casuale)
      // Questo previene la creazione di record duplicati e assicura che l'ID corrisponda all'Auth UID
      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        role: data.role || 'user',
        email: data.email,
        createdAt: new Date()
      });
      
      reset();
      setShowAddForm(false);
      loadUsers();
    } catch (error: any) {
      console.error('Errore durante aggiunta utente:', error);
      alert(error.message);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      loadUsers();
    } catch (error) {
      console.error('Errore durante aggiornamento del ruolo:', error);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${userEmail}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      loadUsers();
    } catch (error) {
      console.error('Errore durante eliminazione utente:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 mr-2" style={{color: '#8d9c71'}} />
          <h2 className="text-xl font-semibold text-gray-900">Gestione Utenti</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2"
          style={{backgroundColor: '#8d9c71'}}
          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuovo Utente
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit(addUser)} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                {...register('name', { required: 'Nome obbligatorio' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email', { 
                  required: 'Email obbligatoria',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email non valida'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                {...register('password', { 
                  required: 'Password obbligatoria',
                  minLength: {
                    value: 6,
                    message: 'Password di almeno 6 caratteri'
                  }
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-md hover:opacity-90 cursor-pointer"
              style={{backgroundColor: '#8d9c71'}}
            >
              Aggiungi
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                reset();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creato</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{backgroundColor: '#8d9c71'}}
                      >
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'user')}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {user.role === 'admin' && (
                    <Shield className="h-4 w-4 text-yellow-500 inline ml-2" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt.toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => deleteUser(user.id, user.email)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Totale utenti: {users.length} | Admin: {users.filter(u => u.role === 'admin').length}
      </div>
    </div>
  );
}