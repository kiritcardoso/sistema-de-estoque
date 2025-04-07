
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock } from '@/contexts/StockContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

const Reports = () => {
  const { items, movements, alerts } = useStock();
  const [reportType, setReportType] = useState('overview');

  // Dados para os gráficos
  const categoryData = items.reduce((acc, item) => {
    const existing = acc.find(cat => cat.category === item.category);
    if (existing) {
      existing.quantity += item.quantity;
      existing.items += 1;
    } else {
      acc.push({
        category: item.category,
        quantity: item.quantity,
        items: 1,
      });
    }
    return acc;
  }, [] as any[]);

  const movementData = movements
    .reduce((acc, movement) => {
      const date = new Date(movement.date).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        if (movement.type === 'entrada') {
          existing.entradas += movement.quantity;
        } else {
          existing.saidas += movement.quantity;
        }
      } else {
        acc.push({
          date,
          entradas: movement.type === 'entrada' ? movement.quantity : 0,
          saidas: movement.type === 'saida' ? movement.quantity : 0,
        });
      }
      return acc;
    }, [] as any[])
    .slice(-7); // Últimos 7 dias

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const lowStockItems = items.filter(item => item.quantity <= item.minStock);
  const expiringSoon = items.filter(item => {
    if (!item.expirationDate) return false;
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Visão Geral</SelectItem>
            <SelectItem value="categories">Por Categoria</SelectItem>
            <SelectItem value="movements">Movimentações</SelectItem>
            <SelectItem value="alerts">Alertas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{items.length}</div>
                <p className="text-xs text-muted-foreground">
                  tipos diferentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  unidades em estoque
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  itens precisam reposição
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{expiringSoon.length}</div>
                <p className="text-xs text-muted-foreground">
                  próximos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantity"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimentações (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="entradas" fill="#22c55e" name="Entradas" />
                    <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {reportType === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório por Categoria</CardTitle>
            <CardDescription>
              Análise detalhada do estoque por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{category.category}</h3>
                    <Badge variant="secondary">{category.items} tipos</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Total em estoque: {category.quantity} unidades
                  </p>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(category.quantity / Math.max(...categoryData.map(c => c.quantity))) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Movimentações</CardTitle>
            <CardDescription>
              Histórico completo de entradas e saídas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movements
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((movement) => (
                  <div key={movement.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{movement.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {movement.responsiblePerson} - {new Date(movement.date).toLocaleString()}
                      </p>
                      {movement.destination && (
                        <p className="text-sm text-muted-foreground">→ {movement.destination}</p>
                      )}
                    </div>
                    <Badge variant={movement.type === 'entrada' ? 'default' : 'secondary'}>
                      {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'alerts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens com Estoque Baixo</CardTitle>
              <CardDescription>
                Itens que precisam de reposição urgente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.brand} - {item.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {item.quantity} / {item.minStock}
                      </p>
                      <Badge variant="destructive">Baixo</Badge>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Todos os itens estão com estoque adequado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens Próximos ao Vencimento</CardTitle>
              <CardDescription>
                Itens que vencem nos próximos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringSoon.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.brand} - Qtd: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-600">
                        {item.expirationDate && new Date(item.expirationDate).toLocaleDateString()}
                      </p>
                      <Badge variant="secondary">Vencendo</Badge>
                    </div>
                  </div>
                ))}
                {expiringSoon.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum item vencendo nos próximos 30 dias
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
