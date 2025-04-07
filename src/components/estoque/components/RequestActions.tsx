
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

interface RequestActionsProps {
  request: TeacherRequest;
  processingRequest: string | null;
  onEdit: (request: TeacherRequest) => void;
  onConfirm: (request: TeacherRequest) => void;
  onReject: (requestId: string) => void;
}

export const RequestActions: React.FC<RequestActionsProps> = ({
  request,
  processingRequest,
  onEdit,
  onConfirm,
  onReject
}) => {
  if (request.status !== 'pendente') return null;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEdit(request)}
        className="text-blue-600 hover:text-blue-700"
      >
        <Edit className="w-4 h-4 mr-1" />
        Editar
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => onConfirm(request)}
        disabled={processingRequest === request.id}
      >
        <Check className="w-4 h-4 mr-1" />
        {processingRequest === request.id ? 'Processando...' : 'Confirmar e Baixar'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700"
        onClick={() => onReject(request.id)}
        disabled={processingRequest === request.id}
      >
        <X className="w-4 h-4 mr-1" />
        Rejeitar
      </Button>
    </div>
  );
};
