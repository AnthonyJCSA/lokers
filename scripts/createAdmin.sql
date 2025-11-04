-- Crear usuario administrador en Supabase
-- Ejecutar en SQL Editor de Supabase

-- Método 1: Insertar directamente en auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mondelez.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Método alternativo: Usar función de Supabase (si la anterior no funciona)
-- SELECT auth.create_user(
--   'admin@mondelez.com',
--   'admin123',
--   '{"provider":"email","providers":["email"]}'::jsonb
-- );