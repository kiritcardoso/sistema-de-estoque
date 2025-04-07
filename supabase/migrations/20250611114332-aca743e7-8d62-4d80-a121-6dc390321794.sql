
-- Criar enum para os tipos de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'estoque', 'compras', 'professor');

-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'professor',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Criar tabela para itens do estoque
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE,
  location TEXT,
  code TEXT UNIQUE,
  status TEXT DEFAULT 'disponivel',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para movimentações
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste', 'uso')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para solicitações de professores
CREATE TABLE public.teacher_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id),
  items JSONB NOT NULL,
  observations TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'rejeitado')),
  confirmed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION public.has_role_access(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN get_user_role(auth.uid()) = 'admin' THEN true
    WHEN get_user_role(auth.uid()) = required_role THEN true
    ELSE false
  END;
$$;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role_access('admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (has_role_access('admin'));

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (has_role_access('admin'));

-- Políticas para stock_items
CREATE POLICY "Estoque and Admin can manage items" ON public.stock_items
  FOR ALL USING (has_role_access('estoque') OR has_role_access('admin'));

CREATE POLICY "Compras can view items" ON public.stock_items
  FOR SELECT USING (has_role_access('compras') OR has_role_access('estoque') OR has_role_access('admin'));

CREATE POLICY "Professores can view items for requests" ON public.stock_items
  FOR SELECT USING (has_role_access('professor') OR has_role_access('estoque') OR has_role_access('admin'));

-- Políticas para stock_movements
CREATE POLICY "Estoque and Admin can manage movements" ON public.stock_movements
  FOR ALL USING (has_role_access('estoque') OR has_role_access('admin'));

CREATE POLICY "Users can view their own movements" ON public.stock_movements
  FOR SELECT USING (auth.uid() = user_id OR has_role_access('estoque') OR has_role_access('admin'));

-- Políticas para teacher_requests
CREATE POLICY "Teachers can create requests" ON public.teacher_requests
  FOR INSERT WITH CHECK (auth.uid() = teacher_id AND has_role_access('professor'));

CREATE POLICY "Teachers can view their requests" ON public.teacher_requests
  FOR SELECT USING (auth.uid() = teacher_id OR has_role_access('estoque') OR has_role_access('admin'));

CREATE POLICY "Estoque can manage requests" ON public.teacher_requests
  FOR ALL USING (has_role_access('estoque') OR has_role_access('admin'));

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'professor'::user_role
  );
  RETURN new;
END;
$$;

-- Trigger para executar a função quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados de exemplo
INSERT INTO public.stock_items (name, category, subcategory, brand, quantity, min_stock, expiration_date, location, code) VALUES
('Papel A4', 'Material Escolar', 'Papel', 'Chamex', 50, 10, '2025-12-31', 'Prateleira A1', 'PAP001'),
('Caneta Azul', 'Material Escolar', 'Canetas', 'BIC', 25, 20, NULL, 'Gaveta B2', 'CAN001'),
('Álcool em Gel', 'Higiene', 'Limpeza', 'Softex', 5, 15, '2024-06-30', 'Armário C1', 'ALC001'),
('Sabonete Líquido', 'Higiene', 'Limpeza', 'Protex', 3, 10, '2024-08-15', 'Armário C1', 'SAB001');
