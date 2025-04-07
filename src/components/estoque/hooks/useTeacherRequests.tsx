import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { Database } from '@/integrations/supabase/types';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

export const useTeacherRequests = () => {
  const { updateItemQuantity, refreshData } = useSupabaseStock();
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .select('*')
        .eq('status', 'pendente')
        .eq('coordination_status', 'aprovado')
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Erro', description: 'Erro ao carregar solicitações', variant: 'destructive' });
      } else {
        // Buscar nomes dos professores e coordenadores separadamente
        const requestsWithTeachers = await Promise.all(
          (data || []).map(async (request) => {
            const teacherName = request.teacher_id ? await getTeacherName(request.teacher_id) : 'Professor não identificado';
            const coordinationName = request.approved_by_coordination ? await getTeacherName(request.approved_by_coordination) : null;
            return { ...request, teacherName, coordinationName };
          })
        );
        setRequests(requestsWithTeachers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = async (teacherId: string) => {
    try {
      console.log('Buscando professor com ID:', teacherId);
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, email')
        .eq('id', teacherId)
        .single();

      console.log('Resultado da busca:', { data, error });

      if (error || !data) {
        console.warn('Professor não encontrado:', teacherId, error);
        return 'Professor não identificado';
      }
      
      return data.nome || data.email || 'Professor sem nome';
    } catch (e) {
      console.error('Erro ao buscar professor:', e);
      return 'Erro ao carregar professor';
    }
  };

  const handleConfirmRequest = async (request: TeacherRequest) => {
    setProcessingRequest(request.id);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        toast({ title: 'Erro', description: 'Usuário não identificado', variant: 'destructive' });
        setProcessingRequest(null);
        return;
      }

      const nomeProfessor = request.teacher_id
        ? await getTeacherName(request.teacher_id)
        : 'Professor desconhecido';

      console.log('Nome do professor encontrado:', nomeProfessor);

      const items = typeof request.items === 'string'
        ? JSON.parse(request.items)
        : request.items || [];

      // Implementar lógica FIFO para cada item solicitado
      for (const requestedItem of items) {
        const itemName = requestedItem.name || requestedItem.item;
        let requestedQuantity = requestedItem.quantity || requestedItem.quantidade || 1;

        if (!itemName || requestedQuantity <= 0) continue;

        // Buscar todos os itens com o mesmo nome, ordenados por data de validade (FIFO)
        const { data: availableItems, error: itemsError } = await supabase
          .from('stock_items')
          .select('*')
          .eq('name', itemName)
          .gt('quantity', 0)
          .order('expiration_date', { ascending: true, nullsFirst: false });

        if (itemsError || !availableItems) {
          console.error('Erro ao buscar itens disponíveis:', itemsError);
          continue;
        }

        // Processar cada item disponível seguindo ordem FIFO
        for (const availableItem of availableItems) {
          if (requestedQuantity <= 0) break;

          const quantityToTake = Math.min(requestedQuantity, availableItem.quantity);
          
          if (quantityToTake > 0) {
            await updateItemQuantity(
              availableItem.id,
              quantityToTake,
              'saida',
              `Solicitação professor - ${nomeProfessor}`,
              request.observations || undefined
            );
            
            requestedQuantity -= quantityToTake;
          }
        }

        // Se ainda restou quantidade solicitada, alertar
        if (requestedQuantity > 0) {
          toast({ 
            title: 'Aviso', 
            description: `${itemName}: ${requestedQuantity} unidades não puderam ser processadas por falta de estoque`,
            variant: 'destructive'
          });
        }
      }

      const { error } = await supabase
        .from('teacher_requests')
        .update({
          status: 'confirmado',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
        })
        .eq('id', request.id);

      if (error) {
        toast({ title: 'Erro', description: 'Falha ao confirmar solicitação', variant: 'destructive' });
      } else {
        toast({ title: 'Solicitação Confirmada', description: 'Itens baixados do estoque' });
        await Promise.all([fetchRequests(), refreshData()]);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Erro inesperado', variant: 'destructive' });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        toast({ title: 'Erro', description: 'Usuário não identificado', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('teacher_requests')
        .update({
          status: 'rejeitado',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
        })
        .eq('id', requestId);

      if (error) {
        toast({ title: 'Erro', description: 'Falha ao rejeitar solicitação', variant: 'destructive' });
      } else {
        toast({ title: 'Solicitação Rejeitada', description: 'A solicitação foi rejeitada' });
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Erro inesperado', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    processingRequest,
    fetchRequests,
    handleConfirmRequest,
    handleRejectRequest,
  };
};
