
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStock } from '@/contexts/StockContext';
import { ArrowUp, ArrowDown, Package } from 'lucide-react';

const StockMovement = () => {
  const { items, movements, updateItemQuantity } = useStock();
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  const handleMovement = (type: 'entrada' | 'saida') => {
    if (!selectedItem || !quantity || !responsiblePerson) {
      return;
    }

    updateItemQuantity(
      selectedItem,
      parseInt(quantity),
      type,
      responsiblePerson,
      destination || undefined
    );

    // Reset form
    setSelectedItem('');
    setQuantity('');
    setResponsiblePerson('');
    setDestination('');
    setNotes('');
  };

  const selectedItemData = items.find(item => item.id === selectedItem);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Movimentação de Estoque</h2>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Movimentação</CardTitle>
          <CardDescription>
            Registre entradas e saídas de produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item">Selecionar Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {item.brand} {item.size && `(${item.size})`} - Qtd: {item.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItemData && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p><strong>Estoque atual:</strong> {selectedItemData.quantity}</p>
                  <p><strong>Localização:</strong> {selectedItemData.location}</p>
                  <p><strong>Código:</strong> {selectedItemData.code}</p>
                </div>
              )}
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

            <div>
              <Label htmlFor="responsible">Responsável *</Label>
              <Input
                id="responsible"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label htmlFor="destination">Destino/Setor (Saída)</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex: Setor Administrativo"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a movimentação..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button 
                onClick={() => handleMovement('entrada')}
                className="flex-1"
                disabled={!selectedItem || !quantity || !responsiblePerson}
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Registrar Entrada
              </Button>
              <Button 
                onClick={() => handleMovement('saida')}
                variant="outline"
                className="flex-1"
                disabled={!selectedItem || !quantity || !responsiblePerson}
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Registrar Saída
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            Últimas movimentações registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 20)
              .map((movement) => (
                <div key={movement.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'entrada' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {movement.type === 'entrada' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{movement.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.responsiblePerson}
                          {movement.destination && ` → ${movement.destination}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={movement.type === 'entrada' ? 'default' : 'secondary'}>
                        {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(movement.date).toLocaleDateString()} às{' '}
                        {new Date(movement.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {movement.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {movement.notes}
                    </p>
                  )}
                </div>
              ))}
            {movements.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovement;
