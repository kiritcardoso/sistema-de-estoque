
import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, LogOut, Send } from 'lucide-react';
import { ItemRequestForm } from '../professor/ItemRequestForm';

export const ProfessorDashboard = () => {
  const { signOut, profile } = useAuthContext();

  const handleSignOut = () => {
    signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">Professor - Sistema de Estoque</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Olá, {profile?.nome || profile?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6" />
              Solicitação de Itens
            </h1>
            <p className="text-muted-foreground mt-2">
              Informe os itens utilizados em suas aulas para que o estoque seja atualizado adequadamente.
            </p>
          </div>
          
          <ItemRequestForm />
        </div>
      </div>
    </div>
  );
};
