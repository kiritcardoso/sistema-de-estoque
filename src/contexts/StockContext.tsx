
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockItem, StockMovement, StockAlert } from '@/types/stock';
import { toast } from '@/hooks/use-toast';

interface StockContextType {
  items: StockItem[];
  movements: StockMovement[];
  alerts: StockAlert[];
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<StockItem>) => void;
  deleteItem: (id: string) => void;
  addMovement: (movement: Omit<StockMovement, 'id'>) => void;
  getItemsByCategory: (category: string) => StockItem[];
  getItemsExpiringSoon: (days: number) => StockItem[];
  getLowStockItems: () => StockItem[];
  updateItemQuantity: (itemId: string, quantityChange: number, movementType: 'entrada' | 'saida', responsiblePerson: string, destination?: string) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedItems = localStorage.getItem('stockItems');
    const savedMovements = localStorage.getItem('stockMovements');
    
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedMovements) {
      setMovements(JSON.parse(savedMovements));
    }
  }, []);

  // Salvar no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('stockItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('stockMovements', JSON.stringify(movements));
  }, [movements]);

  // Atualizar alertas sempre que os itens mudarem
  useEffect(() => {
    updateAlerts();
  }, [items]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addItem = (itemData: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: StockItem = {
      ...itemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setItems(prev => [...prev, newItem]);
    toast({
      title: "Item adicionado",
      description: `${newItem.name} foi adicionado ao estoque com sucesso.`,
    });
  };

  const updateItem = (id: string, updates: Partial<StockItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
    toast({
      title: "Item atualizado",
      description: "Item foi atualizado com sucesso.",
    });
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: `${item?.name} foi removido do estoque.`,
    });
  };

  const addMovement = (movementData: Omit<StockMovement, 'id'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: generateId(),
    };
    
    setMovements(prev => [...prev, newMovement]);
  };

  const updateItemQuantity = (
    itemId: string, 
    quantityChange: number, 
    movementType: 'entrada' | 'saida',
    responsiblePerson: string,
    destination?: string
  ) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + (movementType === 'entrada' ? quantityChange : -quantityChange);
    
    if (newQuantity < 0) {
      toast({
        title: "Erro",
        description: "Quantidade insuficiente em estoque.",
        variant: "destructive",
      });
      return;
    }

    updateItem(itemId, { quantity: newQuantity });
    
    addMovement({
      itemId,
      itemName: item.name,
      type: movementType,
      quantity: Math.abs(quantityChange),
      date: new Date().toISOString(),
      responsiblePerson,
      destination,
    });

    toast({
      title: `${movementType === 'entrada' ? 'Entrada' : 'Saída'} registrada`,
      description: `${Math.abs(quantityChange)} unidades de ${item.name}`,
    });
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const getItemsExpiringSoon = (days: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return items.filter(item => {
      if (!item.expirationDate) return false;
      const expirationDate = new Date(item.expirationDate);
      return expirationDate <= futureDate && expirationDate >= new Date();
    });
  };

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minStock);
  };

  const updateAlerts = () => {
    // Agrupar itens por nome e tamanho
    const groupedItems = items.reduce((acc, item) => {
      const key = `${item.name}-${item.size || 'sem-tamanho'}`;
      if (!acc[key]) {
        acc[key] = {
          items: [],
          totalStock: 0,
          minStock: 0,
          category: item.category,
          name: item.name,
          size: item.size,
        };
      }
      acc[key].items.push(item);
      acc[key].totalStock += item.quantity;
      acc[key].minStock = Math.max(acc[key].minStock, item.minStock);
      return acc;
    }, {} as any);

    const newAlerts: StockAlert[] = Object.values(groupedItems).map((group: any) => {
      let status: 'ok' | 'baixo' | 'critico' = 'ok';
      
      if (group.totalStock <= group.minStock * 0.5) {
        status = 'critico';
      } else if (group.totalStock <= group.minStock) {
        status = 'baixo';
      }

      return {
        itemGroup: group.size ? `${group.name} (${group.size})` : group.name,
        category: group.category,
        size: group.size,
        totalStock: group.totalStock,
        minStock: group.minStock,
        status,
      };
    });

    setAlerts(newAlerts);
  };

  return (
    <StockContext.Provider value={{
      items,
      movements,
      alerts,
      addItem,
      updateItem,
      deleteItem,
      addMovement,
      getItemsByCategory,
      getItemsExpiringSoon,
      getLowStockItems,
      updateItemQuantity,
    }}>
      {children}
    </StockContext.Provider>
  );
};
