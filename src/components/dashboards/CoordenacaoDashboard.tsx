import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, LogOut, Send, Users, FileText } from 'lucide-react';
import { ItemRequestForm } from '../professor/ItemRequestForm';
import { CoordenacaoRequests } from '../coordenacao/CoordenacaoRequests';

export const CoordenacaoDashboard = () => {
  const { signOut, profile } = useAuthContext();
  const [currentView, setCurrentView] = useState<'requests' | 'new-request'>('requests');

  const handleSignOut = () => {
    signOut();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (currentView) {
      case 'requests':
        return <CoordenacaoRequests />;
      case 'new-request':
        return <ItemRequestForm requestType="coordenacao" />;
      default:
        return <CoordenacaoRequests />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">Coordenação - Sistema de Estoque</span>
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

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background/50">
          <nav className="p-4 space-y-2">
            <Button
              variant={currentView === 'requests' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('requests')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Solicitações de Professores
            </Button>
            <Button
              variant={currentView === 'new-request' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('new-request')}
            >
              <Send className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};