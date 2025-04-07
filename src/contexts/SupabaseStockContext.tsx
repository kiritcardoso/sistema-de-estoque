import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SupabaseStockItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  quantity: number;
  min_stock: number;
  expiration_date?: string;
  location?: string;
  code?: string;
  status?: string;
  unit_of_measure?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface SupabaseStockMovement {
  id: string;
  item_id?: string;
  user_id?: string;
  type: string;
  quantity: number;
  reason?: string;
  observations?: string;
  created_at: string;
}

interface TeacherRequest {
  id: string;
  teacher_id?: string;
  items: any;
  observations?: string;
  status?: string;
  confirmed_by?: string;
  created_at: string;
  confirmed_at?: string;
}

interface SupabaseStockContextType {
  items: SupabaseStockItem[];
  movements: SupabaseStockMovement[];
  teacherRequests: TeacherRequest[];
  loading: boolean;
  addItem: (item: Omit<SupabaseStockItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<SupabaseStockItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addMovement: (movement: Omit<SupabaseStockMovement, 'id' | 'created_at'>) => Promise<SupabaseStockMovement>;
  updateItemQuantity: (itemId: string, quantityChange: number, movementType: 'entrada' | 'saida', reason?: string, observations?: string) => Promise<void>;
  createTeacherRequest: (items: any[], observations?: string) => Promise<void>;
  confirmTeacherRequest: (requestId: string) => Promise<void>;
  getLowStockItems: () => SupabaseStockItem[];
  getItemsExpiringSoon: (days: number) => SupabaseStockItem[];
  refreshData: () => Promise<void>;
}

const SupabaseStockContext = createContext<SupabaseStockContextType | undefined>(undefined);

export const useSupabaseStock = () => {
  const context = useContext(SupabaseStockContext);
  if (!context) {
    throw new Error('useSupabaseStock must be used within a SupabaseStockProvider');
  }
  return context;
};

export const SupabaseStockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [items, setItems] = useState<SupabaseStockItem[]>([]);
  const [movements, setMovements] = useState<SupabaseStockMovement[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens do estoque.",
        variant: "destructive",
      });
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchTeacherRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeacherRequests(data || []);
    } catch (error) {
      console.error('Error fetching teacher requests:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchItems(), fetchMovements(), fetchTeacherRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const addItem = async (itemData: Omit<SupabaseStockItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('User not authenticated');

      const userId = sessionData.session.user.id;

      const newItem = {
        ...itemData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('stock_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);

      toast({
        title: "Item adicionado",
        description: `${itemData.name} foi adicionado ao estoque com sucesso.`,
      });

    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar item ao estoque.",
        variant: "destructive",
      });
    }
  };

  const updateItem = async (id: string, updates: Partial<SupabaseStockItem>) => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => item.id === id ? data : item));
      toast({ title: "Item atualizado", description: "Item foi atualizado com sucesso." });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({ title: "Erro", description: "Erro ao atualizar item.", variant: "destructive" });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      const { error } = await supabase.from('stock_items').delete().eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast({ title: "Item removido", description: `${item?.name} foi removido do estoque.` });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: "Erro", description: "Erro ao remover item.", variant: "destructive" });
    }
  };

  const addMovement = async (movementData: Omit<SupabaseStockMovement, 'id' | 'created_at'>): Promise<SupabaseStockMovement> => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('User not authenticated');

      const userId = sessionData.session.user.id;

      const newMovement = {
        ...movementData,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('stock_movements')
        .insert([newMovement])
        .select()
        .single();

      if (error) throw error;

      setMovements(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding movement:', error);
      toast({ title: "Erro", description: "Erro ao registrar movimentação.", variant: "destructive" });
      throw error;
    }
  };

  const updateItemQuantity = async (itemId: string, quantityChange: number, movementType: 'entrada' | 'saida', reason?: string, observations?: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast({ title: "Erro", description: "Item não encontrado.", variant: "destructive" });
        return;
      }

      const newQuantity = item.quantity + (movementType === 'entrada' ? quantityChange : -quantityChange);
      if (newQuantity < 0) {
        toast({ title: "Erro", description: "Quantidade insuficiente em estoque.", variant: "destructive" });
        return;
      }

      await updateItem(itemId, { quantity: newQuantity });
      await addMovement({ item_id: itemId, type: movementType, quantity: Math.abs(quantityChange), reason, observations });

      toast({ title: `${movementType === 'entrada' ? 'Entrada' : 'Saída'} registrada`, description: `${Math.abs(quantityChange)} unidades de ${item.name}` });
      await refreshData();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      toast({ title: "Erro", description: "Erro ao atualizar quantidade do item.", variant: "destructive" });
    }
  };

  const createTeacherRequest = async (items: any[], observations?: string, requestType: string = 'professor') => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .insert([{ 
          teacher_id: user?.id, 
          items: JSON.stringify(items), 
          observations, 
          status: 'pendente',
          request_type: requestType,
          coordination_status: requestType === 'coordenacao' ? 'aprovado' : 'pendente'
        }])
        .select()
        .single();

      if (error) throw error;

      setTeacherRequests(prev => [data, ...prev]);
      toast({ title: "Solicitação enviada", description: "Sua solicitação foi enviada com sucesso e está aguardando confirmação." });
    } catch (error) {
      console.error('Error creating teacher request:', error);
      toast({ title: "Erro", description: "Erro ao enviar solicitação.", variant: "destructive" });
    }
  };

  const confirmTeacherRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .update({ status: 'confirmado', confirmed_by: user?.id, confirmed_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      setTeacherRequests(prev => prev.map(req => req.id === requestId ? data : req));
      toast({ title: "Solicitação confirmada", description: "A solicitação foi confirmada com sucesso." });
    } catch (error) {
      console.error('Error confirming teacher request:', error);
      toast({ title: "Erro", description: "Erro ao confirmar solicitação.", variant: "destructive" });
    }
  };

  const getLowStockItems = () => {
    // Agrupar itens por nome (normalizado) e categoria
    const groupedItems = items.reduce((acc, item) => {
      // Normalizar o nome removendo espaços extras e convertendo para minúsculas
      const normalizedName = item.name.toLowerCase().trim().replace(/\s+/g, ' ');
      const key = `${normalizedName}|${item.category}`;
      
      if (!acc[key]) {
        acc[key] = {
          name: item.name, // Manter o nome original do primeiro item
          category: item.category,
          totalQuantity: 0,
          minStock: item.min_stock, // Usar o estoque mínimo do primeiro item
          items: []
        };
      }
      
      acc[key].totalQuantity += item.quantity;
      acc[key].items.push(item);
      
      return acc;
    }, {} as Record<string, any>);

    // Filtrar apenas os grupos que estão com estoque baixo
    const lowStockGroups = Object.values(groupedItems).filter((group: any) => 
      group.totalQuantity <= group.minStock
    );

    // Para cada grupo com estoque baixo, retornar o primeiro item como representante
    return lowStockGroups.map((group: any) => ({
      ...group.items[0], // Item representante do grupo
      quantity: group.totalQuantity, // Quantidade total do grupo
      min_stock: group.minStock, // Estoque mínimo do grupo
      groupInfo: {
        totalItems: group.items.length,
        brands: group.items.map((item: any) => item.brand).filter(Boolean),
        allItems: group.items
      }
    }));
  };

  const getItemsExpiringSoon = (days: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return items.filter(item => {
      if (!item.expiration_date) return false;
      if (item.quantity === 0) return false; // Não mostrar itens com quantidade 0
      const expirationDate = new Date(item.expiration_date);
      return expirationDate <= futureDate && expirationDate >= new Date();
    });
  };

  return (
    <SupabaseStockContext.Provider value={{
      items,
      movements,
      teacherRequests,
      loading,
      addItem,
      updateItem,
      deleteItem,
      addMovement,
      updateItemQuantity,
      createTeacherRequest,
      confirmTeacherRequest,
      getLowStockItems,
      getItemsExpiringSoon,
      refreshData,
    }}>
      {children}
    </SupabaseStockContext.Provider>
  );
};
