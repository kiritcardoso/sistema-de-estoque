
-- Primeiro, vamos verificar e corrigir as políticas RLS para stock_movements
-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert own movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view all movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert movements" ON public.stock_movements;

-- Criar políticas mais permissivas para permitir operações
CREATE POLICY "Enable read access for authenticated users" ON public.stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.stock_movements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.stock_movements
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Também vamos corrigir as políticas da tabela stock_items para permitir leitura e atualização
DROP POLICY IF EXISTS "Allow select all items" ON public.stock_items;
DROP POLICY IF EXISTS "Allow update all items" ON public.stock_items;

CREATE POLICY "Enable read access for authenticated users" ON public.stock_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.stock_items
    FOR UPDATE USING (auth.role() = 'authenticated');
