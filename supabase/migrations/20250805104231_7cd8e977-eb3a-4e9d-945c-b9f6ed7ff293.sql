-- Corrigir a política de UPDATE para admins
-- A política atual verifica se a linha tem role = 'admin', mas deveria verificar se o usuário atual é admin

DROP POLICY IF EXISTS "Admin update" ON public.usuarios;

-- Criar nova política que verifica se o usuário atual é admin usando a função get_current_user_role
CREATE POLICY "Admin can update users" 
ON public.usuarios 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

-- Garantir que a política "Admin and estoque can read all users" funcione corretamente
-- Ela já está correta, mas vou recriar para garantir

DROP POLICY IF EXISTS "Admin and estoque can read all users" ON public.usuarios;

CREATE POLICY "Admin and estoque can read all users" 
ON public.usuarios 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'estoque'::text]));