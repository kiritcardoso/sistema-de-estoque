
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RequestItemsListProps {
  items: any;
}

export const RequestItemsList: React.FC<RequestItemsListProps> = ({ items }) => {
  let parsedItems: any[] = [];
  
  if (typeof items === 'string') {
    try {
      parsedItems = JSON.parse(items);
    } catch (e) {
      return <p className="text-sm">Erro ao processar itens</p>;
    }
  } else if (Array.isArray(items)) {
    parsedItems = items;
  }
  
  return (
    <>
      {parsedItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
          <span className="font-medium">
            {item.name || item.item || 'Item não especificado'}
          </span>
          <Badge variant="secondary">
            Qtd: {item.quantity || item.quantidade || 1}
          </Badge>
        </div>
      ))}
    </>
  );
};
