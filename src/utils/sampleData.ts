
import { StockItem } from '@/types/stock';

export const sampleItems: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Fralda Descartável',
    category: 'Higiene',
    size: 'P',
    brand: 'Pampers',
    quantity: 45,
    expirationDate: '2025-08-15',
    location: 'Prateleira A1',
    code: 'HI-FR-P01',
    minStock: 50,
  },
  {
    name: 'Papel Higiênico',
    category: 'Higiene',
    brand: 'Neve',
    quantity: 120,
    location: 'Prateleira A2',
    code: 'HI-PA-01',
    minStock: 100,
  },
  {
    name: 'Lápis HB',
    category: 'Escolar',
    brand: 'Faber-Castell',
    quantity: 200,
    location: 'Gaveta B1',
    code: 'ES-LA-01',
    minStock: 150,
  },
  {
    name: 'Álcool em Gel',
    category: 'Higiene',
    size: '500ml',
    brand: 'Antisséptico',
    quantity: 25,
    expirationDate: '2025-12-31',
    location: 'Prateleira A3',
    code: 'HI-AL-500',
    minStock: 30,
  },
  {
    name: 'Notebook',
    category: 'Tecnologia',
    brand: 'Lenovo',
    quantity: 5,
    location: 'Armário C1',
    code: 'TE-NO-01',
    minStock: 3,
  },
];
