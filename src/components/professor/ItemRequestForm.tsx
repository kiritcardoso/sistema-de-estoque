
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Plus, X, Search, Package2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';

interface ItemRequestFormProps {
  requestType?: 'professor' | 'coordenacao';
}

export const ItemRequestForm: React.FC<ItemRequestFormProps> = ({ requestType = 'professor' }) => {
  const { createTeacherRequest, items } = useSupabaseStock();
  const [selectedItems, setSelectedItems] = useState<Array<{id: string, name: string, quantity: number, available: number, unitsPerPackage: number}>>([]);
  const [observations, setObservations] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term and availability
  // Group items by name and sort by expiration date (FIFO)
  const availableItems = items.filter(item => 
    item.quantity > 0 && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // First sort by name, then by expiration date (earliest first - FIFO)
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name);
    }
    if (a.expiration_date && b.expiration_date) {
      return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
    }
    if (a.expiration_date && !b.expiration_date) return -1;
    if (!a.expiration_date && b.expiration_date) return 1;
    return 0;
  });

  const addItem = () => {
    if (!selectedItemId || requestQuantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um item e informe a quantidade válida",
        variant: "destructive",
      });
      return;
    }

    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const unitsPerPackage = parseInt(item.location) || 1;

    if (requestQuantity > item.quantity) {
      toast({
        title: "Erro", 
        description: `Quantidade solicitada (${requestQuantity}) excede o disponível (${item.quantity})`,
        variant: "destructive",
      });
      return;
    }

    const existingIndex = selectedItems.findIndex(selectedItem => selectedItem.id === selectedItemId);
    
    if (existingIndex >= 0) {
      const updatedItems = [...selectedItems];
      const newQuantity = updatedItems[existingIndex].quantity + requestQuantity;
      
      if (newQuantity > item.quantity) {
        toast({
          title: "Erro",
          description: `Quantidade total (${newQuantity}) excede o disponível (${item.quantity})`,
          variant: "destructive",
        });
        return;
      }
      
      updatedItems[existingIndex].quantity = newQuantity;
      setSelectedItems(updatedItems);
    } else {
      setSelectedItems([...selectedItems, {
        id: selectedItemId,
        name: item.name,
        quantity: requestQuantity,
        available: item.quantity,
        unitsPerPackage
      }]);
    }
    
    setSelectedItemId('');
    setRequestQuantity(1);
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const item = selectedItems[index];
    if (newQuantity > item.available) {
      toast({
        title: "Erro",
        description: `Quantidade não pode exceder ${item.available}`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = newQuantity;
    setSelectedItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to the format expected by the backend
      const itemsForRequest = selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
      }));

      await createTeacherRequest(itemsForRequest, observations);
      setSelectedItems([]);
      setObservations('');
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
    }
  };

  const formatStockDisplay = (item: any) => {
    const unitsPerPackage = parseInt(item.location) || 1;
    const totalUnits = item.quantity * unitsPerPackage;
    
    if (unitsPerPackage > 1) {
      return `${item.quantity} pacotes (${totalUnits} unidades)`;
    }
    return `${item.quantity} unidades`;
  };

  const calculateTotalUnits = () => {
    return selectedItems.reduce((sum, item) => {
      if (item.unitsPerPackage > 1) {
        return sum + (item.quantity * item.unitsPerPackage);
      }
      return sum + item.quantity;
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Solicitar Itens do Estoque
        </CardTitle>
        <CardDescription>
          Escolha os itens disponíveis no estoque que você precisa utilizar em suas aulas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search and Add Items Section */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Adicionar Itens à Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar itens no estoque..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Label>Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <span>{item.brand || 'S/Marca'} - Disponível: {formatStockDisplay(item)}</span>
                              {item.expiration_date && (
                                <span className="text-orange-600 font-medium">
                                  Validade: {new Date(item.expiration_date).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>
                    Quantidade
                    {selectedItemId && items.find(i => i.id === selectedItemId) && 
                     parseInt(items.find(i => i.id === selectedItemId)?.location || '1') > 1 && 
                     ' (pacotes)'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={requestQuantity || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRequestQuantity(value === '' ? 0 : parseInt(value) || 0);
                    }}
                  />
                  {selectedItemId && items.find(i => i.id === selectedItemId) && 
                   parseInt(items.find(i => i.id === selectedItemId)?.location || '1') > 1 && requestQuantity && (
                    <p className="text-sm text-muted-foreground mt-1">
                      = {requestQuantity * parseInt(items.find(i => i.id === selectedItemId)?.location || '1')} unidades
                    </p>
                  )}
                </div>
                
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Items Display */}
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Itens Selecionados ({selectedItems.length})</span>
                  <Badge variant="secondary">
                    Total: {calculateTotalUnits()} unidades
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Disponível: {item.unitsPerPackage > 1 ? 
                            `${item.available} pacotes (${item.available * item.unitsPerPackage} unidades)` :
                            `${item.available} unidades`}
                          </p>
                          <p className="font-medium text-primary">
                            Solicitando: {item.unitsPerPackage > 1 ? 
                              `${item.quantity} pacotes = ${item.quantity * item.unitsPerPackage} unidades` :
                              `${item.quantity} unidades`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Badge variant="secondary" className="min-w-[60px] justify-center font-bold">
                            {item.quantity}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= item.available}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações sobre o uso dos itens (Por favor adicionar o nome)</Label>
            <Textarea
              id="observations"
              placeholder="Descreva como você vai usar os itens, contexto da aula, projeto, etc..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Opcional: Ajude o administrador a entender o contexto da sua solicitação
            </p>
          </div>

          {/* Submit Button */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <Button type="submit" className="w-full" size="lg" disabled={selectedItems.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação 
                {selectedItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </Button>
              {selectedItems.length > 0 && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Sua solicitação será enviada para aprovação do administrador
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </CardContent>
    </Card>
  );
};
