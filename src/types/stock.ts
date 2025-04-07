
export interface StockItem {
  id: string;
  name: string;
  category: string;
  size?: string;
  brand: string;
  quantity: number;
  expirationDate?: string;
  location: string;
  code: string;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  date: string;
  responsiblePerson: string;
  destination?: string;
  notes?: string;
}

export interface StockAlert {
  itemGroup: string;
  category: string;
  size?: string;
  totalStock: number;
  minStock: number;
  status: 'ok' | 'baixo' | 'critico';
}
