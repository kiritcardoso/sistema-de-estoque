
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStock } from '@/contexts/StockContext';
import { AlertTriangle, Package, TrendingDown, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { items, alerts, getLowStockItems, getItemsExpiringSoon } = useStock();
  
  const lowStockItems = getLowStockItems();
  const expiringSoonItems = getItemsExpiringSoon(30);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const criticalAlerts = alerts.filter(alert => alert.status === 'critico');
  const lowStockAlerts = alerts.filter(alert => alert.status === 'baixo');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
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
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringSoonItems.length}</div>
            <p className="text-xs text-muted-foreground">
              itens próximos ao vencimento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Estoque</CardTitle>
            <CardDescription>
              Itens que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => alert.status !== 'ok').map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{alert.itemGroup}</p>
                    <p className="text-sm text-muted-foreground">{alert.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      Estoque: {alert.totalStock} / Mín: {alert.minStock}
                    </p>
                    <Badge 
                      variant={alert.status === 'critico' ? 'destructive' : 'secondary'}
                    >
                      {alert.status === 'critico' ? 'Crítico' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              ))}
              {alerts.filter(alert => alert.status !== 'ok').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Todos os estoques estão em níveis adequados
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens Vencendo</CardTitle>
            <CardDescription>
              Próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringSoonItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.brand} - {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Qtd: {item.quantity}</p>
                    <p className="text-sm text-yellow-600">
                      {item.expirationDate && new Date(item.expirationDate).toLocaleDateString()}
                    </p>
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
};

export default Dashboard;
