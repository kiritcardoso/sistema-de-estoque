-- Add coordenacao role to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordenacao';

-- Add coordination approval fields to teacher_requests table
ALTER TABLE teacher_requests 
ADD COLUMN IF NOT EXISTS coordination_status text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS approved_by_coordination uuid REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS coordination_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS coordination_observations text,
ADD COLUMN IF NOT EXISTS request_type text DEFAULT 'professor'; -- 'professor' or 'coordenacao'

-- Update RLS policies for coordenacao role
CREATE POLICY "Coordenacao can view teacher requests" ON teacher_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.role = 'coordenacao'
  )
);

CREATE POLICY "Coordenacao can update teacher requests" ON teacher_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.role = 'coordenacao'
  )
);

CREATE POLICY "Coordenacao can insert requests" ON teacher_requests
FOR INSERT WITH CHECK (
  (auth.uid() = teacher_id AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.role = 'coordenacao'
  ))
);

-- Update existing policies to only show approved requests to estoque/admin
DROP POLICY IF EXISTS "Estoque can view all requests" ON teacher_requests;
CREATE POLICY "Estoque can view approved requests" ON teacher_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.role = 'estoque'
  ) AND (coordination_status = 'aprovado' OR request_type = 'coordenacao')
);

DROP POLICY IF EXISTS "Admin can view all requests" ON teacher_requests;
CREATE POLICY "Admin can view approved requests" ON teacher_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.role = 'admin'
  ) AND (coordination_status = 'aprovado' OR request_type = 'coordenacao')
);