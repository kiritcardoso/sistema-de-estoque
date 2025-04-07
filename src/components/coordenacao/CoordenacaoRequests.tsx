import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Eye, Users, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

export const CoordenacaoRequests = () => {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .select(`
          *,
          teacher:teacher_id (nome, email)
        `)
        .eq('coordination_status', 'pendente')
        .eq('request_type', 'professor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('teacher_requests')
        .update({
          coordination_status: 'aprovado',
          approved_by_coordination: currentUser.user.id,
          coordination_approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação aprovada com sucesso",
      });

      fetchPendingRequests();
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('teacher_requests')
        .update({
          coordination_status: 'rejeitado',
          approved_by_coordination: currentUser.user.id,
          coordination_approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação rejeitada",
      });

      fetchPendingRequests();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Solicitações de Professores</h1>
      </div>

      {requests.length > 0 && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Você tem {requests.length} solicitação(ões) pendente(s) de aprovação.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const items = Array.isArray(request.items) ? request.items : [];
            const teacherName = (request as any).teacher?.nome || 'Professor não identificado';

            return (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Solicitação #{request.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Professor: {teacherName} • {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {request.coordination_status === 'pendente' ? 'Aguardando Aprovação' : request.coordination_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Itens solicitados:</h4>
                    <div className="space-y-2">
                      {items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>{item.name}</span>
                          <Badge variant="secondary">{item.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.observations && (
                    <div>
                      <h4 className="font-medium mb-1">Observações:</h4>
                      <p className="text-sm text-muted-foreground">{request.observations}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request.id)}
                      disabled={processingRequest === request.id}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {processingRequest === request.id ? 'Processando...' : 'Aprovar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleReject(request.id)}
                      disabled={processingRequest === request.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};