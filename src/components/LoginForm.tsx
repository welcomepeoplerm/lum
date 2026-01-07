'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await login(data);
    } catch (err: any) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-center mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-12 h-12"
              style={{color: '#8d9c71'}}
            >
              <path d="M2 21h20" />
              <path d="M5 21V10l7-5l4 2.857" />
              <path d="M12 5v16" />
              <path d="M16 21V12.5l4 2V21" />
              <path d="M8 21v-3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3" />
              <path d="M18 16h.01" strokeWidth="2"/>
              <path d="M16 6h2v3l-1.5 1" />
            </svg>
            <h1 className="ml-3 text-4xl font-bold" style={{color: '#8d9c71'}}>LUM</h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accedi al tuo account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            LyfeUmbria Manager
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                {...register('email', { 
                  required: 'Email obbligatoria',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email non valida'
                  }
                })}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-t-md focus:outline-none focus:z-10 sm:text-sm"
                onFocus={(e) => {(e.target as HTMLInputElement).style.borderColor = '#8d9c71'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(141, 156, 113, 0.2)';}}
                onBlur={(e) => {(e.target as HTMLInputElement).style.borderColor = '#d1d5db'; (e.target as HTMLInputElement).style.boxShadow = 'none';}}
                placeholder="Indirizzo email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                {...register('password', { required: 'Password obbligatoria' })}
                type={showPassword ? 'text' : 'password'}
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black rounded-b-md focus:outline-none focus:z-10 sm:text-sm"
                onFocus={(e) => {(e.target as HTMLInputElement).style.borderColor = '#8d9c71'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(141, 156, 113, 0.2)';}}
                onBlur={(e) => {(e.target as HTMLInputElement).style.borderColor = '#d1d5db'; (e.target as HTMLInputElement).style.boxShadow = 'none';}}
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#8d9c71'
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7a8a60'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8d9c71'}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}