
import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import RoleBasedLayout from '@/components/RoleBasedLayout';

const Index = () => {
  const { loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return <RoleBasedLayout />;
};

export default Index;
