import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Item {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  location: string;
}

interface Props {
  items: Item[];
  selectedItem: string;
  setSelectedItem: (id: string) => void;
}

const SearchableItemSelect: React.FC<Props> = ({ items, selectedItem, setSelectedItem }) => {
  const [search, setSearch] = React.useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar por nome ou marca..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select value={selectedItem} onValueChange={setSelectedItem}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um item" />
        </SelectTrigger>
        <SelectContent>
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} - {item.brand || 'S/Marca'} ({item.quantity})
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground">Nenhum item encontrado</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SearchableItemSelect;
