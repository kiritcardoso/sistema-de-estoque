
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BatchItem {
  itemId: string;
  quantity: number;
  itemName: string;
}

export const BatchMovement = () => {
  const { items, updateItemQuantity } = useSupabaseStock();
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState('');

  const addItemToBatch = () => {
    if (!selectedItem || !quantity) {
      toast({
        title: "Erro",
        description: "Selecione um item e informe a quantidade",
        variant: "destructive",
      });
      return;
    }

    const item = items.find(i => i.id === selectedItem);
    if (!item) return;

    const existingIndex = batchItems.findIndex(bi => bi.itemId === selectedItem);
    
    if (existingIndex >= 0) {
      const updatedBatch = [...batchItems];
      updatedBatch[existingIndex].quantity += parseInt(quantity);
      setBatchItems(updatedBatch);
    } else {
      setBatchItems([...batchItems, {
        itemId: selectedItem,
        quantity: parseInt(quantity),
        itemName: item.name
      }]);
    }

    setSelectedItem('');
    setQuantity('');
  };

  const removeItemFromBatch = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const processBatchMovement = async (type: 'entrada' | 'saida') => {
    if (batchItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao lote",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const batchItem of batchItems) {
        await updateItemQuantity(
          batchItem.itemId,
          batchItem.quantity,
          type,
          reason || undefined,
          observations || undefined
        );
      }

      toast({
        title: "Sucesso",
        description: `Movimentação em lote de ${type} processada com sucesso`,
      });

      // Reset form
      setBatchItems([]);
      setReason('');
      setObservations('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar movimentação em lote",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentação em Lote</CardTitle>
        <CardDescription>
          Registre entrada ou saída de múltiplos itens de uma vez
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="item">Selecionar Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.brand || 'S/Marca'} - Qtd: {item.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex items-end">
            <Button type="button" onClick={addItemToBatch} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao Lote
            </Button>
          </div>
        </div>

        {batchItems.length > 0 && (
          <div className="space-y-2">
            <Label>Itens no Lote</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {batchItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{item.itemName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Qtd: {item.quantity}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemFromBatch(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Compra, Uso em aula"
            />
          </div>

          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre a movimentação..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => processBatchMovement('entrada')}
            className="flex-1"
            disabled={batchItems.length === 0}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Processar Entrada em Lote
          </Button>
          <Button 
            onClick={() => processBatchMovement('saida')}
            variant="outline"
            className="flex-1"
            disabled={batchItems.length === 0}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Processar Saída em Lote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
