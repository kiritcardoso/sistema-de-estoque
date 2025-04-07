
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import SearchableItemSelect from '../SearchableItemSelect';

interface BatchItem {
  itemId: string;
  quantity: number;
  itemName: string;
  unitsPerPackage: number;
}

interface BatchMovementFormProps {
  items: any[];
  selectedItem: string;
  setSelectedItem: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  onBatchMovement: (items: BatchItem[], reason: string, observations: string, type: 'entrada' | 'saida') => void;
}

const BatchMovementForm = ({
  items,
  selectedItem,
  setSelectedItem,
  quantity,
  setQuantity,
  onBatchMovement
}: BatchMovementFormProps) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchReason, setBatchReason] = useState('');
  const [batchObservations, setBatchObservations] = useState('');

  const selectedItemData = items.find(item => item.id === selectedItem);

  const addItemToBatch = () => {
    if (!selectedItem || !quantity) {
      toast({ title: "Erro", description: "Selecione um item e informe a quantidade", variant: "destructive" });
      return;
    }

    const item = items.find(i => i.id === selectedItem);
    if (!item) return;

    const unitsPerPackage = parseInt(item.location) || 1;
    const existingIndex = batchItems.findIndex(bi => bi.itemId === selectedItem);

    if (existingIndex >= 0) {
      const updated = [...batchItems];
      updated[existingIndex].quantity += parseInt(quantity);
      setBatchItems(updated);
    } else {
      setBatchItems([...batchItems, {
        itemId: selectedItem,
        quantity: parseInt(quantity),
        itemName: item.name,
        unitsPerPackage,
      }]);
    }

    setSelectedItem('');
    setQuantity('');
  };

  const removeItemFromBatch = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const processBatchMovement = (type: 'entrada' | 'saida') => {
    if (batchItems.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item ao lote", variant: "destructive" });
      return;
    }

    onBatchMovement(batchItems, batchReason, batchObservations, type);
    setBatchItems([]);
    setBatchReason('');
    setBatchObservations('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentação em Lote</CardTitle>
        <CardDescription>Registre entrada ou saída de múltiplos itens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Selecionar Item</Label>
            <SearchableItemSelect items={items} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
          </div>
          <div>
            <Label>Quantidade {selectedItemData && parseInt(selectedItemData.location) > 1 ? '(em pacotes)' : ''}</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            {selectedItemData && parseInt(selectedItemData.location) > 1 && quantity && (
              <p className="text-sm text-muted-foreground mt-1">= {parseInt(quantity) * parseInt(selectedItemData.location)} unidades</p>
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={addItemToBatch} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar ao Lote
            </Button>
          </div>
        </div>

        {batchItems.length > 0 && (
          <div className="space-y-2">
            <Label>Itens no Lote</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {batchItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.itemName}</span>
                    <div className="text-sm text-muted-foreground">
                      {item.unitsPerPackage > 1 ? (
                        <span>{item.quantity} pacotes = {item.quantity * item.unitsPerPackage} unidades</span>
                      ) : (
                        <span>{item.quantity} unidades</span>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItemFromBatch(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Motivo</Label>
            <Input value={batchReason} onChange={(e) => setBatchReason(e.target.value)} placeholder="Ex: Compra, Uso em aula" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={batchObservations} onChange={(e) => setBatchObservations(e.target.value)} placeholder="Observações sobre a movimentação..." rows={3} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => processBatchMovement('entrada')} className="flex-1" disabled={batchItems.length === 0}>
            <ArrowUp className="w-4 h-4 mr-2" /> Processar Entrada em Lote
          </Button>
          <Button onClick={() => processBatchMovement('saida')} variant="outline" className="flex-1" disabled={batchItems.length === 0}>
            <ArrowDown className="w-4 h-4 mr-2" /> Processar Saída em Lote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchMovementForm;
