
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import SearchableItemSelect from '../SearchableItemSelect';
import QuickAddItemDialog from './QuickAddItemDialog';

interface StockMovementFormProps {
  items: any[];
  selectedItem: string;
  setSelectedItem: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  observations: string;
  setObservations: (value: string) => void;
  onMovement: (type: 'entrada' | 'saida') => void;
}

const StockMovementForm = ({
  items,
  selectedItem,
  setSelectedItem,
  quantity,
  setQuantity,
  reason,
  setReason,
  observations,
  setObservations,
  onMovement
}: StockMovementFormProps) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const selectedItemData = items.find(item => item.id === selectedItem);
  
  const formatStockDisplay = (item: any) => {
    const units = parseInt(item.location) || 1;
    const total = item.quantity * units;
    return units > 1 ? `${item.quantity} pacotes (${total} unidades)` : `${item.quantity} unidades`;
  };

  const handleItemAdded = (newItem: any) => {
    setSelectedItem(newItem.id);
  };

  const handleMovementWithExpiration = (type: 'entrada' | 'saida') => {
    // Se há data de validade definida e é uma entrada, incluir nas observações
    if (expirationDate && type === 'entrada') {
      const newObservations = observations 
        ? `${observations} - Validade: ${new Date(expirationDate).toLocaleDateString('pt-BR')}`
        : `Validade: ${new Date(expirationDate).toLocaleDateString('pt-BR')}`;
      setObservations(newObservations);
    }
    onMovement(type);
    setExpirationDate(''); // Limpar após usar
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Registrar Movimentação Individual</CardTitle>
          <CardDescription>Registre entrada ou saída de um produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Selecionar Item</Label>
                <Button
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowQuickAdd(true)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Novo Produto
                </Button>
              </div>
              <SearchableItemSelect items={items} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
              {selectedItemData && (
                <div className="mt-2 p-3 bg-muted rounded text-sm space-y-1">
                  <p><strong>Estoque atual:</strong> {formatStockDisplay(selectedItemData)}</p>
                  {parseInt(selectedItemData.location) > 1 && (
                    <p><strong>Unidades por pacote:</strong> {selectedItemData.location}</p>
                  )}
                  <p><strong>Código:</strong> {selectedItemData.code || 'N/A'}</p>
                  <p><strong>Estoque mínimo:</strong> {selectedItemData.min_stock}</p>
                  {selectedItemData.expiration_date && (
                    <p><strong>Validade atual:</strong> {new Date(selectedItemData.expiration_date).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label>Quantidade {selectedItemData && parseInt(selectedItemData.location) > 1 ? '(em pacotes)' : ''}</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
              {selectedItemData && parseInt(selectedItemData.location) > 1 && quantity && (
                <p className="text-sm text-muted-foreground mt-1">= {parseInt(quantity) * parseInt(selectedItemData.location)} unidades</p>
              )}
            </div>

            <div>
              <Label>Data de Validade (para entradas)</Label>
              <Input 
                type="date" 
                value={expirationDate} 
                onChange={(e) => setExpirationDate(e.target.value)}
                placeholder="Nova data de validade"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional: Para produtos com validade diferente da cadastrada
              </p>
            </div>

            <div>
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Compra, Uso em sala" />
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observações sobre a movimentação..." rows={3} />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button onClick={() => handleMovementWithExpiration('entrada')} className="flex-1" disabled={!selectedItem || !quantity}>
                <ArrowUp className="w-4 h-4 mr-2" /> Registrar Entrada
              </Button>
              <Button onClick={() => handleMovementWithExpiration('saida')} variant="outline" className="flex-1" disabled={!selectedItem || !quantity}>
                <ArrowDown className="w-4 h-4 mr-2" /> Registrar Saída
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickAddItemDialog
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onItemAdded={handleItemAdded}
      />
    </>
  );
};

export default StockMovementForm;
