
import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Package, TrendingUp, Settings, LogOut, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { UserManagement } from '../admin/UserManagement';
import SupabaseItemManager from '../SupabaseItemManager';
import SupabaseStockMovement from '../SupabaseStockMovement';
import { Reports } from '../shared/Reports';
import { TeacherRequests } from '../estoque/TeacherRequests';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';

export const AdminDashboard = () => {
  const { signOut, profile } = useAuthContext();
  const { items, movements, teacherRequests, getLowStockItems, getItemsExpiringSoon } = useSupabaseStock();
  const [currentView, setCurrentView] = useState('overview');

  const handleSignOut = () => {
    signOut();
    window.location.href = '/login';
  };

  const totalUsers = 12; // This would come from a user count query
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMovements = movements.length;
  const lowStockItems = getLowStockItems();
  const expiringSoonItems = getItemsExpiringSoon(30);
  const pendingRequests = teacherRequests.filter(req => req.status === 'pendente');

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement />;
      case 'estoque':
        return <SupabaseItemManager />;
      case 'movimentacoes':
        return <SupabaseStockMovement />;
      case 'reports':
        return <Reports />;
      case 'requests':
        return <TeacherRequests />;
      default:
        return (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">
                      {pendingRequests.length} solicitação{pendingRequests.length > 1 ? 'ões' : ''} de professor{pendingRequests.length > 1 ? 'es' : ''} aguardando confirmação
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="ml-auto"
                      onClick={() => setCurrentView('requests')}
                    >
                      Ver Solicitações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Usuários cadastrados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-xs text-muted-foreground">
                    {items.length} tipos diferentes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMovements}</div>
                  <p className="text-xs text-muted-foreground">
                    Total registrado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solicitações</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Pendentes
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Estoque Baixo
                  </CardTitle>
                  <CardDescription>
                    Itens abaixo do estoque mínimo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.brand || 'S/Marca'} - {item.location || 'S/Local'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'}>
                            {item.quantity} / {item.min_stock}
                          </Badge>
                          <p className="text-xs text-muted-foreground">Atual / Mínimo</p>
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Todos os estoques estão em níveis adequados
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                    Próximos ao Vencimento
                  </CardTitle>
                  <CardDescription>
                    Itens que vencem nos próximos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {expiringSoonItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.brand || 'S/Marca'} - Qtd: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-yellow-600">
                            {item.expiration_date && new Date(item.expiration_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">Data de vencimento</p>
                        </div>
                      </div>
                    ))}
                    {expiringSoonItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum item vencendo nos próximos 30 dias
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">Admin - Sistema de Estoque</span>
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
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
        <div className="flex space-x-1 mb-6">
          <Button
            variant={currentView === 'overview' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('overview')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
          <Button
            variant={currentView === 'users' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('users')}
          >
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Usuários
          </Button>
          <Button
            variant={currentView === 'estoque' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('estoque')}
          >
            <Package className="h-4 w-4 mr-2" />
            Gerenciar Estoque
          </Button>
          <Button
            variant={currentView === 'movimentacoes' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('movimentacoes')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Movimentações
          </Button>
          <Button
            variant={currentView === 'requests' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('requests')}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Solicitações
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={currentView === 'reports' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('reports')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};
