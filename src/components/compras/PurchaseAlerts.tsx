
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, Calendar } from 'lucide-react';

export const PurchaseAlerts = () => {
  const alerts = [
    {
      id: 1,
      type: 'Estoque Baixo',
      count: 5,
      severity: 'critical',
      items: ['Papel A4', 'Caneta Azul', 'Álcool em Gel', 'Sabonete Líquido', 'Lápis HB']
    },
    {
      id: 2,
      type: 'Vencimento Próximo',
      count: 3,
      severity: 'warning',
      items: ['Álcool em Gel (30/06/2024)', 'Sabonete Líquido (15/08/2024)', 'Desinfetante (10/07/2024)']
    },
    {
      id: 3,
      type: 'Crítico',
      count: 1,
      severity: 'critical',
      items: ['Álcool em Gel - Estoque: 5 | Mínimo: 15']
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Alertas Críticos</h2>
      
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getSeverityIcon(alert.severity)}
                {alert.type}
              </CardTitle>
              <Badge variant={getSeverityColor(alert.severity) as any}>
                {alert.count} {alert.count === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
            <CardDescription>
              Clique para ver a lista detalhada dos itens que necessitam atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alert.items.map((item, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {item}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button size="sm" variant="outline">
                Marcar como Encaminhado
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
