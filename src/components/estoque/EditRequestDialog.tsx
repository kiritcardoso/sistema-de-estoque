
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TeacherRequest = Database['public']['Tables']['teacher_requests']['Row'];

interface EditRequestDialogProps {
  request: TeacherRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface RequestItem {
  id?: string;
  name: string;
  quantity: number;
}

export const EditRequestDialog: React.FC<EditRequestDialogProps> = ({
  request,
  open,
  onOpenChange,
  onSave
}) => {
  const { items } = useSupabaseStock();
  const [editedItems, setEditedItems] = useState<RequestItem[]>([]);
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      let parsedItems: RequestItem[] = [];
      
      if (typeof request.items === 'string') {
        try {
          const rawItems = JSON.parse(request.items);
          parsedItems = Array.isArray(rawItems) ? rawItems : [];
        } catch (e) {
          parsedItems = [];
        }
      } else if (Array.isArray(request.items)) {
        parsedItems = request.items as any[];
      }

      // Normalize the items to match our RequestItem interface
      setEditedItems(parsedItems.map((item: any) => ({
        id: item.id || item.itemId,
        name: item.name || item.item || 'Item não especificado',
        quantity: item.quantity || item.quantidade || 1
      })));
      
      setObservations(request.observations || '');
    }
  }, [request]);

  const handleAddItem = () => {
    setEditedItems(prev => [...prev, { name: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RequestItem, value: string | number) => {
    setEditedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSelectExistingItem = (index: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      handleItemChange(index, 'id', itemId);
      handleItemChange(index, 'name', selectedItem.name);
    }
  };

  const handleSave = async () => {
    if (editedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à solicitação",
        variant: "destructive",
      });
      return;
    }

    const invalidItems = editedItems.filter(item => !item.name || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Erro",
        description: "Todos os itens devem ter nome e quantidade válida",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('teacher_requests')
        .update({
          items: JSON.stringify(editedItems),
          observations: observations || null
        })
        .eq('id', request!.id);

      if (error) {
        console.error('Erro ao salvar solicitação:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar alterações",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Solicitação editada com sucesso",
        });
        onSave();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitação #{request.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Itens Solicitados</Label>
            <div className="space-y-3">
              {editedItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Selecionar do estoque</Label>
                      <Select onValueChange={(value) => handleSelectExistingItem(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolher item existente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((stockItem) => (
                            <SelectItem key={stockItem.id} value={stockItem.id}>
                              {stockItem.name} (Qtd: {stockItem.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Ou digite o nome</Label>
                      <Input
                        placeholder="Nome do item"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </div>
                  
                  {item.id && (
                    <Badge variant="secondary" className="text-xs">
                      ID: {item.id}
                    </Badge>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="observations" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações sobre a solicitação..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
