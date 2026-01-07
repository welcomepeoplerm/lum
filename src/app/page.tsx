'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#8d9c71'}}></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginForm />;
}
