
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, X } from 'lucide-react';

interface RequestStatusBadgeProps {
  status: string | null;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    case 'confirmado':
      return <Badge variant="default" className="text-green-600"><Check className="w-3 h-3 mr-1" />Confirmado</Badge>;
    case 'rejeitado':
      return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejeitado</Badge>;
    default:
      return <Badge variant="secondary">{status || 'Pendente'}</Badge>;
  }
};
