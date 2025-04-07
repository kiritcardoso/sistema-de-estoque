
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockItem {
  id: string;
  code: string | null;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  location: string | null;
  brand: string | null;
  unit_of_measure?: string;
}

interface StockMovementItem {
  id: string;
  code: string | null;
  name: string;
  category: string;
  brand: string | null;
}

interface StockMovement {
  id: string;
  item_id: string | null;
  type: string;
  quantity: number;
  created_at: string;
  reason: string | null;
  observations: string | null;
  user_id: string | null;
  stock_items?: StockMovementItem;
}

export const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [reportType, setReportType] = useState('todos');
  const [items, setItems] = useState<StockItem[]>([]);
  const [allItems, setAllItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [allMovements, setAllMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Definir datas padrão (primeiro dia do mês atual até hoje)
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(format(firstDayOfMonth, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar todos os itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (itemsError) throw itemsError;

      // Buscar movimentações do período
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          stock_items (
            id,
            code,
            name,
            category,
            brand
          )
        `)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      // Armazenar todos os dados
      setAllItems(itemsData || []);
      setAllMovements(movementsData || []);

      // Extrair categorias únicas
      const uniqueCategories = [...new Set((itemsData || []).map(item => item.category))].sort();
      setCategories(uniqueCategories);

      // Aplicar filtro de categoria
      filterDataByCategory(itemsData || [], movementsData || [], selectedCategory);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByCategory = (itemsData: StockItem[], movementsData: StockMovement[], category: string) => {
    if (category === 'todos') {
      setItems(itemsData);
      setMovements(movementsData);
    } else {
      // Filtrar itens por categoria
      const filteredItems = itemsData.filter(item => item.category === category);
      setItems(filteredItems);

      // Filtrar movimentações por categoria do item
      const filteredMovements = movementsData.filter(mov => 
        mov.stock_items?.category === category
      );
      setMovements(filteredMovements);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  // Aplicar filtro quando a categoria mudar
  useEffect(() => {
    if (allItems.length > 0 && allMovements.length > 0) {
      filterDataByCategory(allItems, allMovements, selectedCategory);
    }
  }, [selectedCategory, allItems, allMovements]);

  // First, define the basic filtered data
  const entradas = movements.filter(mov => mov.type === 'entrada');
  const saidas = movements.filter(mov => mov.type === 'saida');

  // Função para filtrar itens "Sem Estoque" apenas se não houver outro item com mesmo nome disponível
  const getItemsWithoutStock = () => {
    // Agrupar itens por nome (normalizado)
    const groupedByName = items.reduce((acc, item) => {
      const normalizedName = item.name.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!acc[normalizedName]) {
        acc[normalizedName] = [];
      }
      acc[normalizedName].push(item);
      return acc;
    }, {} as Record<string, StockItem[]>);

    // Filtrar apenas grupos onde TODOS os itens estão com estoque zero
    const itemsWithoutStock: StockItem[] = [];
    Object.values(groupedByName).forEach(group => {
      const hasAvailableStock = group.some(item => item.quantity > 0);
      if (!hasAvailableStock) {
        // Se nenhum item do grupo tem estoque, adicionar o primeiro como representante
        itemsWithoutStock.push(group[0]);
      }
    });

    return itemsWithoutStock;
  };

  // Função para calcular tempo de duração baseado na média mensal de saída
  const getStockDurationAnalysis = () => {
    // Agrupar itens e movimentações por nome normalizado
    const itemsByName = items.reduce((acc, item) => {
      const normalizedName = item.name.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!acc[normalizedName]) {
        acc[normalizedName] = {
          originalName: item.name,
          currentStock: 0,
          unitOfMeasure: item.unit_of_measure || 'unidade',
          exits: []
        };
      }
      acc[normalizedName].currentStock += item.quantity;
      return acc;
    }, {} as Record<string, { 
      originalName: string; 
      currentStock: number; 
      unitOfMeasure: string;
      exits: Array<{ date: Date; quantity: number }> 
    }>);

    // Adicionar saídas aos grupos
    saidas.forEach(saida => {
      const itemName = saida.stock_items?.name;
      if (!itemName) return;
      
      const normalizedName = itemName.toLowerCase().trim().replace(/\s+/g, ' ');
      if (itemsByName[normalizedName]) {
        itemsByName[normalizedName].exits.push({
          date: new Date(saida.created_at),
          quantity: saida.quantity
        });
      }
    });

    // Calcular duração baseada na média mensal
    const durationAnalysis = Object.entries(itemsByName)
      .map(([normalizedName, data]) => {
        if (data.exits.length === 0) {
          return null; // Ignorar itens sem saídas
        }

        // Calcular média mensal de saída
        const totalQuantityOut = data.exits.reduce((sum, exit) => sum + exit.quantity, 0);
        const monthsPeriod = Math.max(1, (new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
        const monthlyAverageExit = totalQuantityOut / monthsPeriod;

        // Calcular duração estimada em dias
        const estimatedDurationDays = monthlyAverageExit > 0 
          ? Math.round((data.currentStock / monthlyAverageExit) * 30)
          : null;

        return {
          name: data.originalName,
          unitOfMeasure: data.unitOfMeasure,
          currentStock: data.currentStock,
          monthlyAverageExit: Math.round(monthlyAverageExit * 10) / 10,
          estimatedDurationDays,
          totalExits: data.exits.length,
          totalQuantityOut
        };
      })
      .filter(item => item !== null && item.estimatedDurationDays !== null)
      .sort((a, b) => (a!.estimatedDurationDays || 0) - (b!.estimatedDurationDays || 0));

    return durationAnalysis as Array<{
      name: string;
      unitOfMeasure: string;
      currentStock: number;
      monthlyAverageExit: number;
      estimatedDurationDays: number;
      totalExits: number;
      totalQuantityOut: number;
    }>;
  };

  // Função para filtrar itens com baixo estoque apenas se não houver outro item com mesmo nome disponível
  const getLowStockItems = () => {
    // Agrupar itens por nome normalizado
    const itemsByName = items.reduce((acc, item) => {
      const normalizedName = item.name.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!acc[normalizedName]) {
        acc[normalizedName] = [];
      }
      acc[normalizedName].push(item);
      return acc;
    }, {} as Record<string, StockItem[]>);

    // Filtrar itens com baixo estoque apenas se não há outros do mesmo nome com estoque adequado
    const lowStockItems: StockItem[] = [];
    Object.values(itemsByName).forEach(group => {
      const hasAdequateStock = group.some(item => item.quantity > item.min_stock);
      const itemsWithLowStock = group.filter(item => item.quantity <= item.min_stock && item.quantity > 0);
      
      // Se não há itens com estoque adequado no grupo, mostrar os com baixo estoque
      if (!hasAdequateStock && itemsWithLowStock.length > 0) {
        lowStockItems.push(...itemsWithLowStock);
      }
    });

    return lowStockItems;
  };

  // Now call the functions after variables are defined
  const lowStockItems = getLowStockItems();
  const itemsWithoutStock = getItemsWithoutStock();
  const stockDurationAnalysis = getStockDurationAnalysis();

  // Análise de demanda para sugestões
  const getDemandSuggestions = () => {
    const itemDemand = saidas.reduce((acc, mov) => {
      const itemName = mov.stock_items?.name || 'Item não encontrado';
      if (!acc[itemName]) {
        acc[itemName] = { total: 0, frequency: 0 };
      }
      acc[itemName].total += mov.quantity;
      acc[itemName].frequency += 1;
      return acc;
    }, {} as Record<string, { total: number; frequency: number }>);

    return Object.entries(itemDemand)
      .filter(([_, data]) => data.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
  };

  const suggestions = getDemandSuggestions();

  const printReport = () => {
    const printableArea = document.getElementById('printable-area');
    if (printableArea) {
      const printContent = printableArea.innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Relatório de Estoque</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .card { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; }
              .card-header { background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
              .card-content { padding: 15px; }
              .text-red-600 { color: #dc2626; }
              .text-orange-600 { color: #ea580c; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
              .badge-secondary { background-color: #f1f5f9; color: #64748b; }
              .badge-destructive { background-color: #fef2f2; color: #dc2626; }
              .badge-outline { border: 1px solid #e2e8f0; background-color: white; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com controles */}
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Estoque</h2>
          <p className="text-muted-foreground">Relatório detalhado de movimentações e estoque</p>
        </div>
        <Button onClick={printReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Imprimir/Salvar PDF
        </Button>
      </div>

      {/* Filtros de data e categoria */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="estoque_atual">Apenas Estoque Atual</SelectItem>
                  <SelectItem value="entradas">Apenas Entradas no Período</SelectItem>
                  <SelectItem value="saidas">Apenas Saídas no Período</SelectItem>
                   <SelectItem value="baixo_estoque">Apenas Itens Abaixo do Estoque</SelectItem>
                   <SelectItem value="sem_estoque">Apenas Itens Sem Estoque</SelectItem>
                   <SelectItem value="tempo">Análise de Tempo de Duração</SelectItem>
                   <SelectItem value="sugestoes">Apenas Sugestões de Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchData} disabled={loading} className="w-full lg:w-auto">
              {loading ? 'Carregando...' : 'Atualizar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Área para impressão */}
      <div id="printable-area">
        {/* Identificação */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Nome da Escola:</strong> APAE Mogi das Cruzes</p>
              <p><strong>Período do Relatório:</strong> {startDate && endDate ? 
                `${format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}` 
                : 'Selecione o período'}</p>
              <p><strong>Categoria:</strong> {selectedCategory === 'todos' ? 'Todas as categorias' : selectedCategory}</p>
              <p><strong>Tipo de Relatório:</strong> {
                reportType === 'todos' ? 'Relatório Completo' :
                reportType === 'estoque_atual' ? 'Estoque Atual' :
                reportType === 'entradas' ? 'Entradas no Período' :
                 reportType === 'saidas' ? 'Saídas no Período' :
                 reportType === 'baixo_estoque' ? 'Itens com Baixo Estoque' :
                 reportType === 'sem_estoque' ? 'Itens Sem Estoque' :
                 reportType === 'tempo' ? 'Análise de Tempo de Duração' :
                 reportType === 'sugestoes' ? 'Sugestões de Compras' : reportType
              }</p>
              <p><strong>Data de Emissão:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estoque Atual */}
        {(reportType === 'todos' || reportType === 'estoque_atual') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Estoque Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Código</TableHead>
                     <TableHead>Descrição do Item</TableHead>
                     <TableHead>Marca</TableHead>
                     <TableHead>Unidade de Medida</TableHead>
                     <TableHead>Saldo</TableHead>
                      <TableHead>Pacote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.code || '-'}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.brand || '-'}</TableCell>
                        <TableCell>
                          {item.quantity > 1 ? 'pacote' : (item.unit_of_measure || 'unidade')}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Entradas no Período */}
        {(reportType === 'todos' || reportType === 'entradas') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔼 Entradas no Período
                <Badge variant="secondary">{entradas.length} movimentações</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição do Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradas.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{movement.stock_items?.code || '-'}</TableCell>
                      <TableCell>{movement.stock_items?.name || 'Item não encontrado'}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.reason || movement.observations || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {entradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma entrada registrada no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Saídas no Período */}
        {(reportType === 'todos' || reportType === 'saidas') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔽 Saídas no Período
                <Badge variant="secondary">{saidas.length} movimentações</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição do Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Destino</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saidas.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{movement.stock_items?.code || '-'}</TableCell>
                      <TableCell>{movement.stock_items?.name || 'Item não encontrado'}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.reason || movement.observations || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {saidas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma saída registrada no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Itens com Baixo Estoque */}
        {(reportType === 'todos' || reportType === 'baixo_estoque') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Itens com Baixo Estoque
                <Badge variant="destructive">{lowStockItems.length} itens</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição do Item</TableHead>
                     <TableHead>Saldo</TableHead>
                     <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-red-600 font-semibold">{item.quantity}</TableCell>
                      <TableCell>{item.min_stock}</TableCell>
                      <TableCell>
                        {item.quantity === 0 ? 'Sem estoque' : 'Poucas unidades restantes'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {lowStockItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Todos os itens estão com estoque adequado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Itens Sem Estoque */}
        {(reportType === 'todos' || reportType === 'sem_estoque') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚫 Itens Sem Estoque
                <Badge variant="destructive">{itemsWithoutStock.length} itens</Badge>
              </CardTitle>
              <CardDescription>
                Apenas itens que não possuem nenhuma unidade disponível em nenhum código
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição do Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsWithoutStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code || '-'}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.brand || '-'}</TableCell>
                      <TableCell className="text-red-600 font-semibold">Sem estoque</TableCell>
                    </TableRow>
                  ))}
                  {itemsWithoutStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Todos os itens possuem estoque disponível
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Análise de Tempo de Duração */}
        {(reportType === 'todos' || reportType === 'tempo') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⏳ Análise de Tempo de Duração
                <Badge variant="secondary">{stockDurationAnalysis.length} itens</Badge>
              </CardTitle>
              <CardDescription>
                Estimativas de duração dos itens com base no histórico de saídas
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Descrição do Item</TableHead>
                     <TableHead>Unidade de Medida</TableHead>
                     <TableHead>Estoque Atual</TableHead>
                     <TableHead>Saída Mensal Média</TableHead>
                     <TableHead>Duração Estimada</TableHead>
                     <TableHead>Observação</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {stockDurationAnalysis.map((analysis, index) => (
                     <TableRow key={index}>
                       <TableCell>{analysis.name}</TableCell>
                       <TableCell>{analysis.unitOfMeasure}</TableCell>
                       <TableCell>{analysis.currentStock}</TableCell>
                       <TableCell>{analysis.monthlyAverageExit}</TableCell>
                       <TableCell className="font-semibold">
                         {analysis.estimatedDurationDays} dias
                       </TableCell>
                       <TableCell>
                         <Badge variant={
                           analysis.estimatedDurationDays < 30 ? "destructive" :
                           analysis.estimatedDurationDays <= 90 ? "secondary" : "outline"
                         }>
                           {analysis.estimatedDurationDays < 30 ? "🔴 Consumo rápido" :
                            analysis.estimatedDurationDays <= 90 ? "🟡 Consumo moderado" : "🟢 Consumo normal"}
                         </Badge>
                       </TableCell>
                     </TableRow>
                   ))}
                   {stockDurationAnalysis.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center text-muted-foreground">
                         Dados insuficientes para análise de tempo (necessário histórico de saídas)
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        )}

        {/* Sugestões de Compra */}
        {(reportType === 'todos' || reportType === 'sugestoes') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 Sugestões de Compra (Baseado na Demanda)
              </CardTitle>
              <CardDescription>
                Itens com maior saída no período - considere aumentar o estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{suggestion.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.frequency} movimentação(ões) no período
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-orange-600">
                          {suggestion.total} unidades saíram
                        </p>
                        <Badge variant="outline">Alta demanda</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma saída registrada no período para análise
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
