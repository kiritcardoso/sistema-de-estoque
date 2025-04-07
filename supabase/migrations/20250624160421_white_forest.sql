/*
  # Fix RLS Policies for Stock Management

  This migration fixes the Row Level Security policies to work with the existing application structure.

  1. Database Schema Updates
    - Create usuarios table to match application expectations
    - Update RLS policies to work with usuarios table
    - Fix role checking functions

  2. Security Policies
    - Enable proper RLS policies for stock_items
    - Allow admin and estoque roles to manage items
    - Allow professors to view items for requests

  3. User Management
    - Ensure proper user role assignment
    - Fix trigger for new user creation
*/

-- Drop existing policies and functions that might conflict
DROP POLICY IF EXISTS "Estoque and Admin can manage items" ON public.stock_items;
DROP POLICY IF EXISTS "Compras can view items" ON public.stock_items;
DROP POLICY IF EXISTS "Professores can view items for requests" ON public.stock_items;

DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.has_role_access(user_role);

-- Create usuarios table if it doesn't exist (matching application expectations)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'professor',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on usuarios table
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policies for usuarios table
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

CREATE POLICY "Admins can insert usuarios" ON public.usuarios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update usuarios" ON public.usuarios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to get user role from usuarios table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.usuarios WHERE id = user_id;
$$;

-- Function to check if user has required role access
CREATE OR REPLACE FUNCTION public.has_role_access(required_role TEXT)
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

-- Updated policies for stock_items
CREATE POLICY "Admin and estoque can manage stock items" ON public.stock_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

CREATE POLICY "All authenticated users can view stock items" ON public.stock_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Updated policies for stock_movements
DROP POLICY IF EXISTS "Estoque and Admin can manage movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view their own movements" ON public.stock_movements;

CREATE POLICY "Admin and estoque can manage movements" ON public.stock_movements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

CREATE POLICY "Users can view movements" ON public.stock_movements
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

-- Updated policies for teacher_requests
DROP POLICY IF EXISTS "Teachers can create requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Teachers can view their requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Estoque can manage requests" ON public.teacher_requests;

CREATE POLICY "Teachers can create requests" ON public.teacher_requests
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND 
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role = 'professor'
    )
  );

CREATE POLICY "Users can view their requests or admins/estoque can view all" ON public.teacher_requests
  FOR SELECT USING (
    auth.uid() = teacher_id OR 
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

CREATE POLICY "Admin and estoque can manage requests" ON public.teacher_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'estoque')
    )
  );

-- Update the trigger function to use usuarios table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE 
      WHEN new.email = 'admin@sistema.com' THEN 'admin'
      ELSE 'professor'
    END
  );
  RETURN new;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate any existing data from profiles to usuarios if needed
INSERT INTO public.usuarios (id, email, nome, role, active, created_at, updated_at)
SELECT 
  id, 
  email, 
  full_name as nome, 
  role::TEXT, 
  active, 
  created_at, 
  updated_at
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios WHERE usuarios.id = profiles.id
);

-- Create admin user if it doesn't exist
DO $$
BEGIN
  -- Check if admin user exists in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@sistema.com'
  ) THEN
    -- Insert admin user (this would normally be done through Supabase Auth)
    -- This is just to ensure the usuarios record exists
    INSERT INTO public.usuarios (id, email, nome, role, active)
    SELECT 
      gen_random_uuid(),
      'admin@sistema.com',
      'Administrador',
      'admin',
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.usuarios WHERE email = 'admin@sistema.com'
    );
  END IF;
END $$;