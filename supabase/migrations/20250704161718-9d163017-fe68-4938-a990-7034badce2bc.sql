
-- Remover políticas existentes da tabela teacher_requests se houver
DROP POLICY IF EXISTS "Teachers can insert requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Teachers can view own requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Admin can view all requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Estoque can view all requests" ON public.teacher_requests;

-- Habilitar RLS na tabela teacher_requests
ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

-- Política para professores criarem suas próprias solicitações
CREATE POLICY "Teachers can insert requests" ON public.teacher_requests
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Política para professores verem suas próprias solicitações
CREATE POLICY "Teachers can view own requests" ON public.teacher_requests
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Política para admins verem todas as solicitações
CREATE POLICY "Admin can view all requests" ON public.teacher_requests
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para funcionários do estoque verem todas as solicitações
CREATE POLICY "Estoque can view all requests" ON public.teacher_requests
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'estoque'
  )
);

-- Política para admins atualizarem solicitações (confirmar/rejeitar)
CREATE POLICY "Admin can update requests" ON public.teacher_requests
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para funcionários do estoque atualizarem solicitações
CREATE POLICY "Estoque can update requests" ON public.teacher_requests
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'estoque'
  )
);
