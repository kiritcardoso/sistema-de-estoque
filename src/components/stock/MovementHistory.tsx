
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Search, Filter, Calendar, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface MovementHistoryProps {
  items: any[];
  movements: any[];
  onRestoreMovement?: (movement: any) => Promise<void>;
}

const MovementHistory = ({ items, movements, onRestoreMovement }: MovementHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Filtrar movimentações
  const filteredMovements = movements.filter(movement => {
    const item = items.find(i => i.id === movement.item_id);
    
    // Garantir que todos os campos existam antes de fazer a busca
    const itemName = item?.name ? item.name.toLowerCase() : '';
    const itemBrand = item?.brand ? item.brand.toLowerCase() : '';
    const itemCode = item?.code ? item.code.toLowerCase() : '';
    const reason = movement.reason ? movement.reason.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Buscar por nome, marca, código ou motivo - só procurar se searchTerm não estiver vazio
    const matchesSearch = !searchTerm || 
                         itemName.includes(searchLower) || 
                         itemBrand.includes(searchLower) || 
                         itemCode.includes(searchLower) || 
                         reason.includes(searchLower);
    
    const matchesType = filterType === 'all' || movement.type === filterType;
    
    let matchesPeriod = true;
    if (filterPeriod !== 'all') {
      const movementDate = new Date(movement.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterPeriod) {
        case 'today':
          matchesPeriod = daysDiff === 0;
          break;
        case 'week':
          matchesPeriod = daysDiff <= 7;
          break;
        case 'month':
          matchesPeriod = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  const formatMovementDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getMovementTypeColor = (type: string) => {
    return type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleRestoreMovement = async (movement: any) => {
    if (!onRestoreMovement) return;
    
    try {
      setRestoringId(movement.id);
      await onRestoreMovement(movement);
      toast({
        title: "Item restaurado",
        description: `A saída de ${movement.quantity} unidades foi restaurada.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico de Movimentações
        </CardTitle>
        <CardDescription>Visualize e filtre as movimentações registradas</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por item, marca, código ou motivo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-8"
              />
            </div>
            {searchTerm && (
              <div className="text-xs text-muted-foreground mt-1">
                Encontrados {filteredMovements.length} resultados para "{searchTerm}"
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={(value) => {
              setFilterPeriod(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Marca/Código</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? `Nenhuma movimentação encontrada para "${searchTerm}"` : 'Nenhuma movimentação encontrada'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovements.map((movement) => {
                  const item = items.find(i => i.id === movement.item_id);
                  const units = item ? parseInt(item.location) || 1 : 1;
                  const hasPackage = units > 1;
                  const { date, time } = formatMovementDate(movement.created_at);
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Badge className={getMovementTypeColor(movement.type)}>
                          {movement.type === 'entrada' ? (
                            <><ArrowUp className="w-3 h-3 mr-1" /> Entrada</>
                          ) : (
                            <><ArrowDown className="w-3 h-3 mr-1" /> Saída</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item?.name || 'Item não encontrado'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item?.brand && (
                            <div className="text-sm font-medium">{item.brand}</div>
                          )}
                          {item?.code && (
                            <div className="text-xs text-muted-foreground">Cód: {item.code}</div>
                          )}
                          {!item?.brand && !item?.code && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                            {hasPackage ? ' pacotes' : ' unidades'}
                          </div>
                          {hasPackage && (
                            <div className="text-xs text-muted-foreground">
                              = {movement.quantity * units} unidades
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {movement.reason || 'Não informado'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {movement.observations || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.type === 'saida' && onRestoreMovement && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreMovement(movement)}
                            disabled={restoringId === movement.id}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            {restoringId === movement.id ? 'Restaurando...' : 'Restaurar'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMovements.length)} de {filteredMovements.length} registros
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MovementHistory;
