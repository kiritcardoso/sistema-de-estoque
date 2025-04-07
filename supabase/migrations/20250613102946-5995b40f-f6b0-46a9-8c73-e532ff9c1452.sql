
-- Criar o tipo enum user_role se não existir
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'professor', 'estoque', 'compras');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar se a coluna role existe e tem o tipo correto
DO $$ 
BEGIN
    -- Se a coluna role não existir, adicionar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role user_role NOT NULL DEFAULT 'professor'::user_role;
    END IF;
    
    -- Se existir mas com tipo errado, alterar
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role' AND data_type != 'USER-DEFINED') THEN
        ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
    END IF;
END $$;

-- Atualizar a função handle_new_user para usar o tipo correto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    CASE 
      WHEN new.email = 'admin@sistema.com' THEN 'admin'::user_role
      ELSE 'professor'::user_role
    END
  );
  RETURN new;
END;
$function$;

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
