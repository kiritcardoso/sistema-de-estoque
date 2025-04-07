-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Admin and estoque can read all users" ON public.usuarios;

-- Criar função segura para verificar se o usuário é admin ou estoque
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- Criar política correta usando a função
CREATE POLICY "Admin and estoque can read all users" 
ON public.usuarios 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'estoque'));