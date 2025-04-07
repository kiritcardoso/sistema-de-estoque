
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestItemsList } from './RequestItemsList';
import { RequestActions } from './RequestActions';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

interface RequestCardProps {
  request: TeacherRequest;
  processingRequest: string | null;
  onEdit: (request: TeacherRequest) => void;
  onConfirm: (request: TeacherRequest) => void;
  onReject: (requestId: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  processingRequest,
  onEdit,
  onConfirm,
  onReject
}) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">Solicitação #{request.id.slice(0, 8)}</h3>
            <RequestStatusBadge status={request.status} />
            {request.status === 'pendente' && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Solicitado por: {(request as any).teacherName || 'Professor não identificado'}
            {(request as any).coordinationName && request.request_type === 'professor' && (
              <span> • Autorizado por: {(request as any).coordinationName}</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Criado em: {new Date(request.created_at).toLocaleDateString('pt-BR')} às {new Date(request.created_at).toLocaleTimeString('pt-BR')}
          </p>
          {request.confirmed_at && (
            <p className="text-sm text-muted-foreground">
              Processado em: {new Date(request.confirmed_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <RequestActions
          request={request}
          processingRequest={processingRequest}
          onEdit={onEdit}
          onConfirm={onConfirm}
          onReject={onReject}
        />
      </div>
      
      <div className="mb-3">
        <h4 className="font-medium mb-2">Itens solicitados:</h4>
        <div className="space-y-2">
          <RequestItemsList items={request.items} />
        </div>
      </div>

      {request.observations && (
        <div>
          <h4 className="font-medium mb-1">Observações:</h4>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {request.observations}
          </p>
        </div>
      )}
    </div>
  );
};
