
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { List, Bell } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { EditRequestDialog } from './EditRequestDialog';
import { RequestCard } from './components/RequestCard';
import { useTeacherRequests } from './hooks/useTeacherRequests';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

export const TeacherRequests = () => {
  const {
    requests,
    loading,
    processingRequest,
    fetchRequests,
    handleConfirmRequest,
    handleRejectRequest
  } = useTeacherRequests();

  const [editingRequest, setEditingRequest] = useState<TeacherRequest | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditRequest = (request: TeacherRequest) => {
    setEditingRequest(request);
    setEditDialogOpen(true);
  };

  const handleSaveRequest = () => {
    fetchRequests();
  };

  const pendingRequests = requests.filter(req => req.status === 'pendente');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Bell className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{pendingRequests.length}</strong> solicitação{pendingRequests.length > 1 ? 'ões' : ''} pendente{pendingRequests.length > 1 ? 's' : ''} aguardando confirmação
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Solicitações de Professores
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length} Pendente{pendingRequests.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Confirme as solicitações para baixar automaticamente os itens do estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                processingRequest={processingRequest}
                onEdit={handleEditRequest}
                onConfirm={handleConfirmRequest}
                onReject={handleRejectRequest}
              />
            ))}
            {requests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma solicitação encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <EditRequestDialog
        request={editingRequest}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveRequest}
      />
    </div>
  );
};
