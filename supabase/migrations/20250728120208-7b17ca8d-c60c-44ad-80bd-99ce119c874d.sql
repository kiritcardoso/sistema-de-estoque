-- Permitir que admin e estoque vejam dados de todos os usuários para exibir nomes nas solicitações
CREATE POLICY "Admin and estoque can read all users" 
ON public.usuarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = auth.uid() 
    AND (u.role = 'admin' OR u.role = 'estoque')
  )
);