
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface SearchableItemSelectProps {
  items: any[];
  selectedItem: string;
  setSelectedItem: (value: string) => void;
}

const SearchableItemSelect = ({ items, selectedItem, setSelectedItem }: SearchableItemSelectProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredItems = items.filter((item) => {
    const itemName = item.name ? item.name.toLowerCase() : '';
    const itemBrand = item.brand ? item.brand.toLowerCase() : '';
    const itemCode = item.code ? item.code.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Buscar por nome, marca ou código
    return !searchTerm || 
           itemName.includes(searchLower) || 
           itemBrand.includes(searchLower) || 
           itemCode.includes(searchLower);
  }).sort((a, b) => {
    // Ordenar por data de validade (mais próxima primeiro - FIFO)
    if (a.expiration_date && b.expiration_date) {
      return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
    }
    if (a.expiration_date && !b.expiration_date) return -1;
    if (!a.expiration_date && b.expiration_date) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar por nome, marca ou código..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <div className="text-xs text-muted-foreground">
          Encontrados {filteredItems.length} resultados para "{searchTerm}"
        </div>
      )}
      <Select value={selectedItem} onValueChange={setSelectedItem}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um item" />
        </SelectTrigger>
        <SelectContent>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex flex-col">
                  <span>{item.name} - {item.brand || 'S/Marca'} ({item.quantity})</span>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {item.code && <span>Cód: {item.code}</span>}
                    {item.expiration_date && (
                      <span className="text-orange-600 font-medium">
                        Val: {new Date(item.expiration_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground">
              {searchTerm ? `Nenhum item encontrado para "${searchTerm}"` : 'Nenhum item encontrado'}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SearchableItemSelect;
