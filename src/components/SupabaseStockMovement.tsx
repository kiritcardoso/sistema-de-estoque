
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { toast } from '@/hooks/use-toast';
import StockMovementForm from './stock/StockMovementForm';
import BatchMovementForm from './stock/BatchMovementForm';
import MovementHistory from './stock/MovementHistory';

interface BatchItem {
  itemId: string;
  quantity: number;
  itemName: string;
  unitsPerPackage: number;
}

const SupabaseStockMovement = () => {
  const { items, movements, updateItemQuantity, addMovement, loading } = useSupabaseStock();
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState('');

  const handleMovement = async (type: 'entrada' | 'saida') => {
    if (!selectedItem || !quantity) return;

    await updateItemQuantity(
      selectedItem,
      parseInt(quantity),
      type,
      reason || undefined,
      observations || undefined
    );

    setSelectedItem('');
    setQuantity('');
    setReason('');
    setObservations('');
  };

  const handleBatchMovement = async (
    batchItems: BatchItem[], 
    batchReason: string, 
    batchObservations: string, 
    type: 'entrada' | 'saida'
  ) => {
    try {
      for (const bi of batchItems) {
        await updateItemQuantity(
          bi.itemId,
          bi.quantity,
          type,
          batchReason || undefined,
          batchObservations || undefined
        );
      }
      toast({ title: "Sucesso", description: `Movimentação em lote de ${type} processada com sucesso` });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao processar movimentação em lote", variant: "destructive" });
    }
  };

  const handleRestoreMovement = async (movement: any) => {
    try {
      const item = items.find(i => i.id === movement.item_id);
      if (!item) {
        throw new Error('Item não encontrado');
      }

      // Criar uma movimentação de entrada para reverter a saída
      await addMovement({
        item_id: movement.item_id,
        type: 'entrada',
        quantity: movement.quantity,
        reason: `Restauração da movimentação: ${movement.reason || 'Não informado'}`,
        observations: `Movimentação restaurada em ${new Date().toLocaleDateString('pt-BR')} - Original: ${movement.observations || 'Sem observações'}`
      });

      // Atualizar a quantidade do item
      await updateItemQuantity(movement.item_id, movement.quantity, 'entrada');
    } catch (error) {
      console.error('Erro ao restaurar movimentação:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Movimentação de Estoque</h2>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="batch">Em Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <StockMovementForm
            items={items}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            quantity={quantity}
            setQuantity={setQuantity}
            reason={reason}
            setReason={setReason}
            observations={observations}
            setObservations={setObservations}
            onMovement={handleMovement}
          />
        </TabsContent>

        <TabsContent value="batch">
          <BatchMovementForm
            items={items}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            quantity={quantity}
            setQuantity={setQuantity}
            onBatchMovement={handleBatchMovement}
          />
        </TabsContent>
      </Tabs>

      <MovementHistory 
        items={items} 
        movements={movements} 
        onRestoreMovement={handleRestoreMovement}
      />
    </div>
  );
};

export default SupabaseStockMovement;
