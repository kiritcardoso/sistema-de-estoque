
import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, LogOut, AlertTriangle, Calendar, Eye } from 'lucide-react';
import { PurchaseAlerts } from '../compras/PurchaseAlerts';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';

export const ComprasDashboard = () => {
  const { signOut, profile } = useAuthContext();
  const { getLowStockItems, getItemsExpiringSoon } = useSupabaseStock();

  const handleSignOut = () => {
    signOut();
    window.location.href = '/login';
  };

  const lowStockItems = getLowStockItems();
  const expiringSoonItems = getItemsExpiringSoon(30);
  const criticalItems = lowStockItems.filter(item => item.quantity === 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-xl">Compras - Sistema de Estoque</span>
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
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Itens precisam de reposição
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoonItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Itens vencem em 30 dias
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crítico</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{criticalItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Atenção urgente necessária
              </p>
            </CardContent>
          </Card>
        </div>

        <PurchaseAlerts />
      </div>
    </div>
  );
};
