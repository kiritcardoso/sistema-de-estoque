
-- Corrigir configuração do banco para resolver erros de cadastro de usuário

-- Primeiro, remover o trigger conflitante da tabela profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função conflitante
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar nova função que usa apenas a tabela usuarios (que já existe e funciona)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Inserir apenas na tabela usuarios (não na profiles)
  INSERT INTO public.usuarios (id, email, nome, role, active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE 
      WHEN new.email = 'admin@sistema.com' THEN 'admin'
      ELSE 'professor'
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, usuarios.nome),
    updated_at = now();
  
  RETURN new;
END;
$$;

-- Recriar o trigger para usar a nova função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Remover políticas RLS da tabela profiles que podem estar causando conflitos
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Garantir que as políticas RLS da tabela usuarios estão corretas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view all profiles if admin or estoque" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can update usuarios" ON public.usuarios;

-- Recriar políticas RLS para a tabela usuarios
CREATE POLICY "Users can view their own profile" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles if admin or estoque" ON public.usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

CREATE POLICY "System can insert usuarios" ON public.usuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update usuarios" ON public.usuarios
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
