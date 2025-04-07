import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSupabaseStock } from '@/contexts/SupabaseStockContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus, Search, Trash, Calendar, Package, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ItemEditDialog from './ItemEditDialog';

const SupabaseItemManager = () => {
  const { items, addItem, deleteItem, loading } = useSupabaseStock();
  const { profile } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
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

  // Check if user has permission to add/delete items
  const canManageItems = profile?.role === 'admin' || profile?.role === 'estoque';

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageItems) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para adicionar itens.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name || !formData.category || !formData.quantity || !formData.min_stock || !formData.unit_of_measure) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    await addItem({
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
    setShowAddForm(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!canManageItems) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para excluir itens.",
        variant: "destructive",
      });
      return;
    }
    
    await deleteItem(itemId);
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

  const calculateUnits = (packages: number, unitsPerPackage: number) => {
    return packages * unitsPerPackage;
  };

  const formatStockDisplay = (item: any) => {
    const unitsPerPackage = parseInt(item.location) || 1;
    const totalUnits = calculateUnits(item.quantity, unitsPerPackage);
    
    if (unitsPerPackage > 1) {
      return `${item.quantity} pacotes (${totalUnits} unidades)`;
    }
    return `${item.quantity} unidades`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Itens</h2>
        {canManageItems && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        )}
      </div>

      {!canManageItems && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">
              <strong>Acesso Limitado:</strong> Você tem permissão apenas para visualizar os itens. 
              Para adicionar ou excluir itens, entre em contato com um administrador.
            </p>
          </CardContent>
        </Card>
      )}

      {showAddForm && canManageItems && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Item</CardTitle>
            <CardDescription>
              Preencha as informações do item. Campos com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Ex: 10 (pacotes)"
                />
              </div>

              <div>
                <Label htmlFor="units_per_package">Unidades por Pacote (opcional)</Label>
                <Input
                  id="units_per_package"
                  type="number"
                  value={formData.units_per_package}
                  onChange={(e) => setFormData(prev => ({ ...prev, units_per_package: e.target.value }))}
                  placeholder="Ex: 9 (unidades por pacote)"
                />
              </div>

              <div>
                <Label htmlFor="min_stock">Estoque Mínimo *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))}
                  placeholder="Ex: 5 (pacotes)"
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

              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Adicionar Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Itens</CardTitle>
          <CardDescription>
            Gerencie todos os itens do seu estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, marca ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const unitsPerPackage = parseInt(item.location) || 1;
              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {item.subcategory && <Badge variant="outline">{item.subcategory}</Badge>}
                        <Badge>{item.category}</Badge>
                        {item.quantity <= item.min_stock && (
                          <Badge variant="destructive">Estoque Baixo</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Marca:</p>
                          <p className="font-medium">{item.brand || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Código:</p>
                          <p className="font-medium">{item.code || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estoque:</p>
                          <p className="font-medium text-lg">
                            {formatStockDisplay(item)}
                          </p>
                        </div>
                        {unitsPerPackage > 1 && (
                          <div>
                            <p className="text-muted-foreground">Por pacote:</p>
                            <p className="font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {unitsPerPackage} unidades
                            </p>
                          </div>
                        )}
                      </div>

                      {item.expiration_date && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <Calendar className="w-3 h-3" />
                          Validade: {new Date(item.expiration_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    {canManageItems && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ItemEditDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />
    </div>
  );
};

export default SupabaseItemManager;
