import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStock } from '@/contexts/StockContext';
import { Plus, Search, Trash, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ItemManager = () => {
  const { items, addItem, deleteItem } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    brand: '',
    quantity: '',
    expirationDate: '',
    location: '',
    code: '',
    minStock: '',
  });

  const categories = ['Higiene', 'Escolar', 'Tecnologia', 'Alimentação', 'Limpeza', 'Medicamentos'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.brand || !formData.quantity || !formData.code || !formData.minStock) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      name: formData.name,
      category: formData.category,
      size: formData.size || undefined,
      brand: formData.brand,
      quantity: parseInt(formData.quantity),
      expirationDate: formData.expirationDate || undefined,
      location: formData.location || 'Não especificado',
      code: formData.code,
      minStock: parseInt(formData.minStock),
    });

    setFormData({
      name: '',
      category: '',
      size: '',
      brand: '',
      quantity: '',
      expirationDate: '',
      location: '',
      code: '',
      minStock: '',
    });
    setShowAddForm(false);
  };

  const generateCode = () => {
    if (formData.category && formData.name) {
      const catCode = formData.category.substring(0, 2).toUpperCase();
      const nameCode = formData.name.substring(0, 2).toUpperCase();
      const sizeCode = formData.size ? formData.size.toUpperCase() : '';
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        code: `${catCode}-${nameCode}${sizeCode}-${randomNum}`
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Itens</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Item *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Fralda Descartável"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
                <Label htmlFor="size">Tamanho/Variação</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Ex: P, M, G"
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Ex: Pampers, Huggies"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="minStock">Estoque Mínimo *</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="expirationDate">Data de Validade</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Prateleira B3"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="code">Código do Item *</Label>
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
            {filteredItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.size && <Badge variant="outline">{item.size}</Badge>}
                      <Badge>{item.category}</Badge>
                      {item.quantity <= item.minStock && (
                        <Badge variant="destructive">Estoque Baixo</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <p><strong>Marca:</strong> {item.brand}</p>
                      <p><strong>Código:</strong> {item.code}</p>
                      <p><strong>Quantidade:</strong> {item.quantity}</p>
                      <p><strong>Localização:</strong> {item.location}</p>
                      {item.expirationDate && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.expirationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemManager;
