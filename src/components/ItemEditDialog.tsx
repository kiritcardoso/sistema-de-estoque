
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { toast } from '@/hooks/use-toast';

interface ItemEditDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ItemEditDialog = ({ item, open, onOpenChange }: ItemEditDialogProps) => {
  const { updateItem } = useSupabaseStock();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    brand: '',
    min_stock: '',
    expiration_date: '',
    location: '',
    code: '',
    unit_of_measure: '',
  });

  // Atualizar formData sempre que o item mudar ou o diálogo abrir
  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        brand: item.brand || '',
        min_stock: item.min_stock?.toString() || '',
        expiration_date: item.expiration_date || '',
        location: item.location || '',
        code: item.code || '',
        unit_of_measure: item.unit_of_measure || 'unidade',
      });
    }
  }, [item, open]);

  const categories = ['Higiene', 'Material Escolar', 'Tecnologia', 'Alimentação', 'Limpeza', 'Medicamentos', 'Outros'];

  const subcategoriesByCategory = {
    'Higiene': ['Fraldas', 'Lenços', 'Sabonetes', 'Shampoos', 'Papel Higiênico', 'Outros'],
    'Material Escolar': ['Papel', 'Canetas', 'Lápis', 'Cola', 'Tesouras', 'EVA', 'Outros'],
    'Tecnologia': ['Computadores', 'Impressoras', 'Cartuchos', 'Cabos', 'Outros'],
    'Alimentação': ['Lanches', 'Bebidas', 'Frutas', 'Verduras', 'Cesta basica', 'Outros'],
    'Limpeza': ['Detergentes', 'Desinfetantes', 'Vassouras', 'Panos', 'Outros'],
    'Medicamentos': ['Analgésicos', 'Antibióticos', 'Vitaminas', 'Primeiros Socorros', 'Outros'],
    'Outros': ['Brinquedos', 'Potes', 'Copos', 'Descartaveis']
  };

  const unitsOfMeasure = ['unidade', 'pacote', 'metro', 'grama'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    await updateItem(item.id, {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      brand: formData.brand || undefined,
      min_stock: parseInt(formData.min_stock) || 0,
      expiration_date: formData.expiration_date || undefined,
      location: formData.location || undefined,
      code: formData.code || undefined,
      unit_of_measure: formData.unit_of_measure,
    });

    onOpenChange(false);
    toast({
      title: "Item atualizado",
      description: "As informações do item foram atualizadas com sucesso.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Altere as informações do item conforme necessário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategoria</Label>
            <Select 
              value={formData.subcategory} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a subcategoria" />
              </SelectTrigger>
              <SelectContent>
                {formData.category && subcategoriesByCategory[formData.category as keyof typeof subcategoriesByCategory]?.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="min_stock">Estoque Mínimo</Label>
            <Input
              id="min_stock"
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="location">Unidades por Pacote</Label>
            <Input
              id="location"
              type="number"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ex: 9 (unidades por pacote)"
            />
          </div>

          <div>
            <Label htmlFor="expiration_date">Data de Validade</Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="code">Código do Item</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="unit_of_measure">Unidade de Medida</Label>
            <Select 
              value={formData.unit_of_measure} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measure: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unitsOfMeasure.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemEditDialog;
