
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { Package, TrendingUp, List, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import SupabaseItemManager from '@/components/SupabaseItemManager';
import SupabaseStockMovement from '@/components/SupabaseStockMovement';
import { TeacherRequests } from '@/components/estoque/TeacherRequests';
import { Reports } from '@/components/shared/Reports';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';

export const EstoqueDashboard = () => {
  const { signOut, profile } = useAuthContext();
  const { refreshData, loading, items, movements, teacherRequests, getLowStockItems } = useSupabaseStock();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    await signOut();
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = getLowStockItems();
  const pendingRequests = teacherRequests.filter(req => req.status === 'pendente').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Estoque</h1>
                <p className="text-sm text-gray-500">Painel do Estoque</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="items">Gerenciar Itens</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-xs text-muted-foreground">{items.length} tipos diferentes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grupos com Estoque Baixo</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground">Produtos precisam reposição</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
                  <List className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos com Estoque Baixo</CardTitle>
                  <CardDescription>
                    Produtos agrupados por nome que precisam reposição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          {item.groupInfo && item.groupInfo.brands.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.groupInfo.brands.map((brand: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {brand}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {item.groupInfo && item.groupInfo.totalItems > 1 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {item.groupInfo.totalItems} marcas/variações disponíveis
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">
                            {item.quantity} / {item.min_stock}
                          </p>
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Baixo
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Todos os produtos estão com estoque adequado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Acesso rápido às funções principais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('items')}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Adicionar Novo Item
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('movements')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Registrar Movimentação
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('requests')}
                  >
                    <List className="mr-2 h-4 w-4" />
                    Ver Solicitações ({pendingRequests})
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="items">
            <SupabaseItemManager />
          </TabsContent>
          
          <TabsContent value="movements">
            <SupabaseStockMovement />
          </TabsContent>
          
          <TabsContent value="requests">
            <TeacherRequests />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
