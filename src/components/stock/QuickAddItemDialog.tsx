
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { toast } from '@/hooks/use-toast';

interface QuickAddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: any) => void;
}

const QuickAddItemDialog = ({ open, onOpenChange, onItemAdded }: QuickAddItemDialogProps) => {
  const { addItem } = useSupabaseStock();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    brand: '',
    quantity: '',
    expiration_date: '',
    units_per_package: '',
    code: '',
    min_stock: '',
    unit_of_measure: 'unidade',
  });

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
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.min_stock || !formData.unit_of_measure) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const newItem = await addItem({
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      brand: formData.brand || undefined,
      quantity: parseInt(formData.quantity),
      expiration_date: formData.expiration_date || undefined,
      location: formData.units_per_package || undefined,
      code: formData.code || undefined,
      min_stock: parseInt(formData.min_stock),
      status: 'disponivel',
      unit_of_measure: formData.unit_of_measure,
    });

    // Resetar formulário
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      brand: '',
      quantity: '',
      expiration_date: '',
      units_per_package: '',
      code: '',
      min_stock: '',
      unit_of_measure: 'unidade',
    });

    onOpenChange(false);
    onItemAdded(newItem);
  };

  const generateCode = () => {
    if (formData.category && formData.name) {
      const catCode = formData.category.substring(0, 2).toUpperCase();
      const nameCode = formData.name.substring(0, 2).toUpperCase();
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        code: `${catCode}-${nameCode}-${randomNum}`
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          <DialogDescription>
            Adicione um novo produto ao estoque rapidamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome do Item *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Fralda Pampers Confort"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
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
              disabled={!formData.category}
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
              placeholder="Ex: Pampers, Huggies"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantidade Inicial *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Ex: 10"
            />
          </div>

          <div>
            <Label htmlFor="units_per_package">Unidades por Pacote</Label>
            <Input
              id="units_per_package"
              type="number"
              value={formData.units_per_package}
              onChange={(e) => setFormData(prev => ({ ...prev, units_per_package: e.target.value }))}
              placeholder="Ex: 9"
            />
          </div>

          <div>
            <Label htmlFor="min_stock">Estoque Mínimo *</Label>
            <Input
              id="min_stock"
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))}
              placeholder="Ex: 5"
            />
          </div>

          <div>
            <Label htmlFor="unit_of_measure">Unidade de Medida *</Label>
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

          <div>
            <Label htmlFor="expiration_date">Data de Validade</Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="code">Código do Item</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: HI-FR-P01"
                />
              </div>
              <Button type="button" onClick={generateCode} className="mt-6">
                Gerar Código
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddItemDialog;
